/*
 * pwix:logger/src/common/definitions/severity.def.js
 * 
 * Cf. RFC 5424 - The Syslog Protocol
 * 
 * RFC 5424                  The Syslog Protocol                 March 2009
 * 
 *            Numerical         Severity
 *              Code
 * 
 *               0       Emergency: system is unusable
 *               1       Alert: action must be taken immediately
 *               2       Critical: critical conditions
 *               3       Error: error conditions
 *               4       Warning: warning conditions
 *               5       Notice: normal but significant condition
 *               6       Informational: informational messages
 *               7       Debug: debug-level messages
 * 
 *               Table 2. Syslog Message Severities
 * 
 * or man 3 syslog
 * 
 *     Values for level
 *         This determines the importance of the message.  The levels are, in order of decreasing importance:
 *  
 *         LOG_EMERG      system is unusable
 *         LOG_ALERT      action must be taken immediately
 *         LOG_CRIT       critical conditions
 *         LOG_ERR        error conditions
 *         LOG_WARNING    warning conditions
 *         LOG_NOTICE     normal, but significant, condition
 *         LOG_INFO       informational message
 *         LOG_DEBUG      debug-level message
 */

import _ from 'lodash';
import { strict as assert } from 'node:assert';

export const Severity = {
    // the list of knwn constants
    C: {
        ALERT: 'ALERT',
        CRIT: 'CRITICAL',
        CRITICAL: 'CRITICAL',
        DEBUG: 'DEBUG',
        EMERG: 'EMERGENCY',
        EMERGENCY: 'EMERGENCY',
        ERR: 'ERROR',
        ERROR: 'ERROR',
        INFO: 'INFORMATIONAL',
        INFORMATIONAL: 'INFORMATIONAL',
        LOG: 'LOG',
        NOTICE: 'NOTICE',
        WARN: 'WARNING',
        WARNING: 'WARNING'
    }
};

_.merge( Severity, {
    // the severity order from 0 to 7
    K: [
        {
            id: Severity.C.EMERGENCY,
            synonyms: [
                Severity.C.EMERG
            ]
        },
        {
            id: Severity.C.ALERT
        },
        {
            id: Severity.C.CRITICAL,
            synonyms: [
                Severity.C.CRIT
            ]
        },
        {
            id: Severity.C.ERROR,
            synonyms: [
                Severity.C.ERR
            ]
        },
        {
            id: Severity.C.WARNING,
            synonyms: [
                Severity.C.WARN
            ]
        },
        {
            id: Severity.C.NOTICE
        },
        {
            id: Severity.C.INFORMATIONAL,
            synonyms: [
                Severity.C.INFO
            ]
        },
        {
            id: Severity.C.DEBUG
        }
    ],

    /**
     * @returns {Array<String>} the list of ordered Severity's
     */
    Knowns(){
        return this.K;
    },

    /**
     * @param {String} a a severity
     * @param {String} b another severity
     * @returns {Integer} -1 if a < b, +1 if a > b, 0 else
     *  a < b means that a.severity is lesser than b.severity
     */
    compare( a, b ){
        const idx_a = this.level( a );
        const idx_b = this.level( b);
        return idx_a < idx_b ? -1 : ( idx_a > idx_b ? +1 : 0 );
    },

    /**
     * @param {String} severity a severity, from Severity.C
     * @returns {Integer} the level of the severity (or of one of its synonyms) which happens to be the index of its definition in K array
     *  or -1 if not found
     */
    level( severity ){
        let found = -1;
        const knowns = this.Knowns();
        for( let i=0 ; i<knowns.length ; ++i ){
            const def = knowns[i];
            if( def.id === severity ){
                found = i;
                break;
            }
            const synonyms = def.synonyms || [];
            if (synonyms.includes( severity )){
                found = i;
                break;
            }
        }
        return found;
    }
});
