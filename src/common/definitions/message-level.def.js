/*
 * pwix:logger/src/common/definitions/message-level.def.js
 */

import _ from 'lodash';
const assert = require( 'assert' ).strict;

export const MessageLevel = {
    C: {
        ALERT: 'ALERT',
        CRIT: 'CRIT',
        DEBUG: 'DEBUG',
        EMERG: 'EMERG',
        ERR: 'ERR',
        ERROR: 'ERROR',
        INFO: 'INFO',
        LOG: 'LOG',
        NOTICE: 'NOTICE',
        WARNING: 'WARNING'
    }
};
// to prevent ReferenceError: Cannot access 'MessageLevel' before initialization
_.merge( MessageLevel, {
    K: [
        {
            id: MessageLevel.C.ALERT
        },
        {
            id: MessageLevel.C.CRIT
        },
        {
            id: MessageLevel.C.DEBUG
        },
        {
            id: MessageLevel.C.EMERG
        },
        {
            id: MessageLevel.C.ERR
        },
        {
            id: MessageLevel.C.ERROR,  // not described in man 3 syslog, but used here as a synonym for ERR
            synonym: MessageLevel.C.ERR
        },
        {
            id: MessageLevel.C.INFO
        },
        {
            id: MessageLevel.C.LOG,    // not described in man 3 syslog, but used here as a default value and a synonym for INFO
            synonym: MessageLevel.C.INFO
        },
        {
            id: MessageLevel.C.NOTICE
        },
        {
            id: MessageLevel.C.WARNING
        }
    ],
    DefaultType: MessageLevel.C.LOG,

    /**
     * @param {String} id an identifier
     * @returns {Object} the MessageLevel definition, or null
     */
    byId( id ){
        let found = null;
        this.Knowns().every(( def ) => {
            if( def.id === id ){
                found = def;
            }
            return found === null;
        });
        return found;
    },

    /**
     * @returns {String} the identifier of the default type
     *  Happens to be LOG, itself a synonym for INFO
     */
    defaultClientType(){
        return this.DefaultType;
    },

    /**
     * @param {Object} def a MessageLevel definition as returned by MessageLevel.Knowns()
     * @returns {String} the identifier
     */
    id( def ){
        return def.id;
    },

    /**
     * @returns {Array} the list of managed MessageLevel definitions
     */
    Knowns(){
        return this.K;
    },

    /**
     * @param {Object} def a MessageLevel definition as returned by MessageLevel.Knowns()
     * @returns {String} the standard level this one is synonym of, or this same one
     */
    synonym( def ){
        return def.synonym || def.id;
    },

    /**
     * @param {String} id the identifier of the type
     * @returns {Array<String>} the list of synonyms for this one, including itself
     */
    synonyms( id ){
        let array = {};
        array[id] = true;
        const self = this;
        this.Knowns().forEach(( def ) => {
            const def_id = self.id( def );
            const def_synonym = self.synonym( def );
            if( def_id === id || def_synonym === id ){
                array[def_id] = true;
                array[def_synonym] = true;
            }
        });
        return Object.keys( array );
    }
});
