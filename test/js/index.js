import { Tinytest } from 'meteor/tinytest';
import { Logger } from 'meteor/pwix:logger';

function isolated( run ){
    const Class = Logger.LoggerClass;
    const config = Logger.configure();
    const registry = Class._byName;
    const engines = Class._engines;
    Class._byName = Object.create( null );
    const calls = [];
    Class._engines = { console: { info: ( ...args ) => calls.push( args ) } };
    try {
        Logger.configure({ engine: 'console', severityLevelClient: Logger.Severity.C.INFO,
            severityLevelServer: Logger.Severity.C.INFO, verbosity: Logger.C.Verbose.NONE });
        run( calls );
    } finally {
        Class._byName = registry;
        Class._engines = engines;
        Logger.configure( config );
    }
}

Tinytest.add( 'logger - instance overrides and live global settings', ( test ) => isolated(( calls ) => {
    const options = Object.freeze({ severityLevelClient: Logger.Severity.C.ERROR,
        severityLevelServer: Logger.Severity.C.ERROR });
    const quiet = Logger.get( options );
    const inherited = Logger.get( 'inherited' );
    quiet._callerHint = inherited._callerHint = () => '';
    quiet.info( 'hidden' );
    inherited.info( 'visible' );
    test.equal( calls, [[ 'visible' ]] );
    Logger.configure({ severityLevelClient: Logger.Severity.C.EMERGENCY,
        severityLevelServer: Logger.Severity.C.EMERGENCY });
    inherited.info( 'hidden too' );
    test.equal( calls.length, 1 );
    test.isTrue( Logger.get() === quiet );
    test.isTrue( Logger.get({ severityLevelClient: Logger.Severity.C.DEBUG }) === quiet );
    Logger.configure({ severityLevelClient: Logger.Severity.C.DEBUG,
        severityLevelServer: Logger.Severity.C.DEBUG });
    quiet.info( 'still hidden' );
    test.equal( calls.length, 1 );
}));

Tinytest.add( 'logger - named options are copied and engines are independent', ( test ) => isolated(( calls ) => {
    const options = Object.freeze({ name: 'named', engine: 'console' });
    const logger = Logger.get( options );
    logger._callerHint = () => '';
    test.equal( options.name, 'named' );
    test.isTrue( Logger.get( 'named' ) === logger );
    const other = Logger.get( 'other', { engine: 'pino' });
    other._callerHint = () => '';
    const pinoCalls = [];
    other._createPino = () => ({ info: ( ...args ) => pinoCalls.push( args ) });
    Logger.configure({ engine: 'pino' });
    logger.info( 'console' );
    other.info( 'pino' );
    test.equal( calls, [[ 'console' ]] );
    test.equal( pinoCalls, [[ 'pino' ]] );
}));

Tinytest.add( 'logger - server package prefix supports relative and absolute paths', ( test ) => {
    if( Meteor.isServer ){
        isolated(( calls ) => {
            const logger = Logger.get();
            for( const hint of [
                'packages/pwix:accounts-manager/src/server/js/users_accounts.js:28',
                '/home/pierre/app/packages/pwix:accounts-manager/src/server/js/users_accounts.js:28'
            ] ){
                logger._callerHint = () => hint;
                logger.info( 'onLogin()' );
            }
            test.equal( calls, [
                [ 'pwix:accounts-manager', 'onLogin()' ],
                [ 'pwix:accounts-manager', 'onLogin()' ]
            ]);
        });
    }
});

Tinytest.add( 'logger - invalid configuration is rejected atomically', ( test ) => isolated(() => {
    const before = Logger.configure();
    const defaults = { ...Logger._defaults };
    for( const value of [ null, undefined, [], 'console', 1, () => {} ] ){
        test.throws( () => Logger.configure( value ));
    }
    for( const options of [ { engine: 'unknown' }, { engine: null },
        { severityLevelClient: 'LOG' }, { severityLevelServer: 3 },
        { verbosity: -1 }, { verbosity: 2 }, { verbosity: '1' },
        { engine: 'pino', severityLevelClient: undefined } ] ){
        test.throws( () => Logger.configure( options ));
        test.equal( Logger.configure(), before );
    }
    Logger.configure({ severityLevelServer: Logger.Severity.C.ERR });
    test.equal( Logger.configure().severityLevelServer, Logger.Severity.C.ERROR );
    test.equal( Logger._defaults, defaults );
    const copy = Logger.configure();
    copy.engine = 'invalid';
    test.equal( Logger.configure().engine, 'console' );
}));

Tinytest.add( 'logger - invalid instance arguments do not create loggers', ( test ) => isolated(() => {
    for( const args of [ [ null ], [ [] ], [ 1 ], [ '' ], [ { name: '' } ],
        [ { name: 42 } ], [ 'x', null ], [ 'x', { name: 'y' } ],
        [ {}, {} ], [ 'x', {}, {} ], [ { engine: 'unknown' } ],
        [ 'x', { severityLevelServer: 'invalid' } ] ] ){
        test.throws( () => Logger.get( ...args ));
    }
    test.equal( Object.keys( Logger.LoggerClass._byName ), [] );
    test.throws( () => new Logger.LoggerClass( 'direct', { engine: 'invalid' } ));
    test.isTrue( Logger.get( 'constructor' ) instanceof Logger.LoggerClass );
}));

Tinytest.add( 'logger - unknown configuration and instance keys warn and are ignored', ( test ) => isolated(() => {
    const warn = console.warn;
    const warnings = [];
    console.warn = ( ...args ) => warnings.push( args );
    try {
        const before = Logger.configure();
        Logger.configure({ unknown: true });
        test.equal( Logger.configure(), before );
        Logger.get({ unknown: true });
        test.equal( warnings.length, 2 );
    } finally {
        console.warn = warn;
    }
}));
