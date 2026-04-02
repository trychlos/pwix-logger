/*
 * pwix:logger/src/common/js/get.js
 */

import { LoggerClass } from '../classes/logger.class';

/**
 * @summary a shortcut for configure() + instanciate()
 */
Logger.get = function(){
    return LoggerClass.get( ...arguments ) || new LoggerClass( ...arguments );
};
