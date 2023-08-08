import GanttApiService from '@/services/GanttApiService.js';

import GanttFilterHighlightBehavior from './gantt-filter-behavior/GanttFilterHighlight.behavior';
import GanttFilterHideBehavior from './gantt-filter-behavior/GanttFilterHide.behavior';
import GanttFilterShowBehavior from './gantt-filter-behavior/GanttFilterShow.behavior';

import GanttFilterOption from './gantt-filter-behavior/GanttFilterOption';
import GanttFilterOptionString from './gantt-filter-behavior/GanttFilterOptionString';

export default class GanttFilter{
    
    #ApiService;
    #filterBehavior = null;
    #rootUid = null;
    isLoading = true;

    userFilter = null;
    userFilters = [];

    options = {
        search:         new GanttFilterOptionString('search'),

        startDate:      new GanttFilterOptionString('startDate'),
        finishDate:     new GanttFilterOptionString('finishDate'),

        donors:         new GanttFilterOption('donors'),
        responsible:    new GanttFilterOption('responsible'),
        commitments:    new GanttFilterOption('commitments'),
        commitmentType: new GanttFilterOption('commitmentType'),
        outputs:        new GanttFilterOption('outputs'),     
    };
    
    results = 'SHOW';

    resultsBehavior = { 
        'SHOW':      GanttFilterShowBehavior,
        'HIDE':      GanttFilterHideBehavior,
        'HIGHLIGHT': GanttFilterHighlightBehavior,
    };

    constructor( rootUid, query ) {
        this.#ApiService = new GanttApiService();
        this.#rootUid = rootUid;
        this.#init( query );
    }

    async #init( query ){
        this.isLoading = true;

        this.fetchUserFilters();
        const filtersResponse = await this.#ApiService.fetchFilters( { uid: this.#rootUid } );
        this.#restoreListOption( filtersResponse );
        this.#restoreSelectedOption( query );

        this.isLoading = false;
    }

    #restoreListOption( filtersResponse ){
        Object.keys(this.options).forEach( name => { 
            this.options[name].setList( filtersResponse.data );
        });
    }

    #restoreSelectedOption( query ){
        Object.keys(this.options).forEach( name => { 
            this.options[name].setSelected( query );
        });
    }

    choseUserFilter( key ){
        if( key === null) return;

        this.resetFilterOptions();

        const userFilterParams = this.userFilters[key].params;

        this.#restoreSelectedOption( userFilterParams );

    }


    resetFilters(){
        if(this.#filterBehavior !== null) this.#filterBehavior.cancelFiltration();        
    }

    resetFilterOptions(){
        Object.keys(this.options).forEach( name => { 
            this.options[name].resetValue();
        });
    }

    async saveUserFilter( name ){
        this.userFilters.push( {
            name,
            params: this.getParams()
        } );
        this.userFilter = this.userFilters.length - 1;

        const responseUserFilter = await this.#ApiService.updateUserFilters( { userFilters: this.userFilters } );
    }

    async removeUserFilter( id ){

        this.userFilter = null;
        this.userFilters.splice( id, 1 );
        const responseUserFilter = await this.#ApiService.updateUserFilters( { userFilters: this.userFilters } );
        
    }

    async fetchUserFilters(){
        const filtersResponse = await this.#ApiService.fetchUserFilters();
        this.userFilters = filtersResponse.data.userFilters;
    }

    async fetchFilteredData( params ){
        const filtersResponse = await this.#ApiService.fetchInitialData( this.#rootUid, params );
        return filtersResponse.data;
    }

    filterItems( allItems, filteredItems ){
        if(this.#filterBehavior !== null) this.#filterBehavior.cancelFiltration();

        this.#filterBehavior = new this.resultsBehavior[this.results]();

        this.#filterBehavior.filter(allItems, filteredItems);
    }

    getParams(){
        const result = {};
        Object.keys(this.options).forEach( name => { 
                const query = this.options[name].getSelectedForQuery();
                if( query ) result[this.options[name].nameOption] = query;
        });
        return result; 
    }
}
