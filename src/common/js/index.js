/*
 * pwix:logger/src/common/js/index.js
 */

// classes
import { LoggerClass } from '../classes/logger.class';

// definitions
import { Severity } from '../definitions/severity.def';

import './global.js';
import './constants.js';
import './functions.js';
//
import './configure.js';
import './get.js';

Logger.LoggerClass = LoggerClass;

Logger.Severity = Severity;
