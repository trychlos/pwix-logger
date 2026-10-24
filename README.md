# pwix:logger

## What is it ?

A simple Meteor package, based on pino, to improve logging operations. It primarily aims to be fully compliant with `console` interface.

## Why ?

I used to `console.log()` (resp. `console.warn()` and so on) everywhere in my code. Fine and useful, but two behaviors bother me:

- client-side logs are not configurable on an environment basis, and so I get the same logs in production than in development where I would prefer a level-basis logging on production environments

- server-side logs do not always expand objects if they are too deep in a structure.

- standard server-side logs colors are rather poor when sent to the console (which is fine when sent to a file)

So this package just extends the standard NodeJS console to add the two above features.

### On the client side

It you do nothing else, the logs displayed in the DevTools console will attribute the callsite of each logged line to the `logger.class.js` file. In order to actually simulate the `console.log()` behavior, and get the real callsite, you have to configure your DevTools to ignore this package. Just add `pwix:logger` to IgnoreList.

## Installation

This Meteor package is installable with the usual command:

```sh
    meteor add pwix:logger
    meteor npm install lodash pino pino-pretty --save
```

## Usage

As soon as possible in your application:

```js
    import { Logger } from 'meteor/pwix:logger';

    Logger.configure({ ... });      // optional
    Logger.get({ ... });            // instanciate a new Logger instance than anyone can use, maybe with some specific options
```

Then, anywhere where you want emit a log, with the very same arguments that you would use when calling `console.log()`:

```js
    import { Logger } from 'meteor/pwix:logger';

    const logger = Logger.get();    // it is not needed to provide parameters to get back the already instanciated default instance
    logger.log( ... );
```

When used from a package, `pwix:logger` is able to recognize the originating package and able to prefix each line with this package owner and name. So you no more need to do that in your code, and this lighten a bit it.

## Provides

### `Logger`

The exported `Logger` global object provides following items:

#### Classes

##### `Logger.LoggerClass`

The actual Logger class. It provides following methods:

1. Severity-based

    - `Logger.LoggerClass.alert()`

    - `Logger.LoggerClass.critical()`

    - `Logger.LoggerClass.debug()`

    - `Logger.LoggerClass.emergency()`

    - `Logger.LoggerClass.error()`

    - `Logger.LoggerClass.info()`

    - `Logger.LoggerClass.notice()`

    - `Logger.LoggerClass.warning()`

2. `console`-interface compliance

    - `Logger.LoggerClass.log()` mapped to `Logger.LoggerClass.notice()`

    - `Logger.LoggerClass.warn()` mapped to `Logger.LoggerClass.warning()`

    - `Logger.LoggerClass.trace()` mapped to `Logger.LoggerClass.debug()`

    NB. A mapping suggestion from `console`

    - `console.debug(data[, ...args])` -> `Logger.LoggerClass.debug()`
    - `console.error([data][, ...args])` -> `Logger.LoggerClass.error()`
    - `console.info([data][, ...args])` -> `Logger.LoggerClass.info()`
    - `console.log([data][, ...args])` -> `Logger.LoggerClass.notice()`
    - `console.trace([message][, ...args])` -> `Logger.LoggerClass.debug()`
    - `console.warn([data][, ...args])` -> `Logger.LoggerClass.warning()`

3. Verbosity

    - `Logger.LoggerClass.verbose( verbosityObject, ...args )`

        where `verbosityObject` is an object with following keys:

        - `verbosity`: the current verbosity level
        - `against`: the verbosity level that we want honor at the moment.

#### Definitions

##### `Logger.Severity`

The managed severities as of RFC 5424 - The Syslog Protocol:

- `Logger.Severity.C.EMERGENCY`
- `Logger.Severity.C.ALERT`
- `Logger.Severity.C.CRITICAL`
- `Logger.Severity.C.ERROR`
- `Logger.Severity.C.WARNING`
- `Logger.Severity.C.NOTICE`
- `Logger.Severity.C.INFO`
- `Logger.Severity.C.DEBUG`

#### Functions

##### `Logger.configure( configuration<Object> ): <Object>`

See [below](#configuration).

##### `Logger.get( options<Object> ): <Logger.LoggerClass>`

Returns the instanciated Logger.LoggerClass instance, instanciating a new instance if not already done.

In the most usual case, you will need a single, unnamed, logger instance for all your application.

But in the eventuality you would want some separate logger for a specific task or module, you can name your Logger instance, provide it options at first instanciation, and then get back this same named Logger.

Options are in an object with following keys:

- `name`

    If you want name a particular Logger instance.

    Getting back this very instance will require to provide this same name, or another `default` instance will be returned (and maybe instanciated with default options).

    The name can be specified as a key in an options object, or as the first string of the arguments list.

Instance options also accept `engine`, `severityLevelClient`, and `severityLevelServer`,
with the same accepted values as the global configuration below. Explicit options
are copied on first creation and override the global settings for that instance.
Omitted options follow subsequent `Logger.configure()` changes. Options passed
when retrieving an existing instance are validated but do not reconfigure it.
The caller's options object is never modified.

```js
    const quiet = Logger.get({ severityLevelClient: Logger.Severity.C.ERROR });
    const audit = Logger.get('audit', { engine: 'pino' });
    const worker = Logger.get({ name: 'worker', severityLevelServer: Logger.Severity.C.WARNING });
```

Names must be nonempty strings. Use either an options object (with an optional
`name`) or a name followed by an options object without a `name` key.
`verbosity` controls global configuration diagnostics and is not an instance option.

## Configuration

The package's behavior can be configured through a call to the `Logger.configure()` method, with just a single javascript object argument, which itself should only contains the options you want override.

Known configuration options are:

- which severities have a stack trace ?
- which color for which severities ?
- re-map each console-interface method to another function
- whether to prefix the lines originating from a package with this package name

- `engine`

    The name of the log engine to be used, among:

    - `console`
    - `pino`

    Default is `console`.

- `severityLevelClient`

    The minimum severity level to be logged to the client.

    Default is `Logger.Severity.C.INFO`.

- `severityLevelServer`

    Default is `Logger.Severity.C.INFO`.

- `verbosity`

    Define the expected verbosity level.

    The accepted value can be any or-ed combination of following:

    - `Logger.C.Verbose.NONE`

        Do not display any trace log to the console.

    - `Logger.C.Verbose.CONFIGURE`

        Trace `Logger.configure()` calls and their result.

        This is the default.

Calling `Logger.configure()` without arguments returns a copy of the current
configuration. Updates require a plain object. `engine` must be `console` or
`pino`; severity thresholds must be recognized `Logger.Severity.C` values
(including their aliases). `Logger.Severity.C.LOG` is not a severity threshold.
`verbosity` must be `Logger.C.Verbose.NONE` or `Logger.C.Verbose.CONFIGURE`.

Invalid known values throw a `TypeError` before any configuration changes or
instance creation. Unknown keys warn and are ignored. These rules also apply to
instance options. Explicit `null` and `undefined` are not accepted as options or
configuration values.

Please note that `Logger.configure()` method should be called in the same terms both in client and server sides.

Remind too that Meteor packages are instanciated at application level. They are so only configurable once, or, in other words, only one instance has to be or can be configured. Addtionnal calls to `Logger.configure()` will just override the previous one. You have been warned: **only the application should configure a package**.

## NPM peer dependencies

Starting with v 1.0.0, and in accordance with advices from [the Meteor Guide](https://guide.meteor.com/writing-atmosphere-packages.html#peer-npm-dependencies), we no more hardcode NPM dependencies in the `Npm.depends` clause of the `package.js`.

Instead we check npm versions of installed packages at runtime, on server startup, in development environment.

Dependencies as of v 1.1.0:

```js
    'lodash': '^4.17.0',
    'pino': '^10.3.0',
    'pino-pretty': '^13.1.3'
```

Each of these dependencies should be installed at application level:
```
    meteor npm install <package> --save
```

## Translations

None at the moment.

## Cookies and comparable technologies

None at the moment.

## Issues & help

In case of support or error, please report your issue request to our [issues tracker](https://github.com/trychlos/pwix-logger/issues).

---
P. Wieser
- Last updated on 2026, Oct. 24th
