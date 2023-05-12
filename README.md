[![npm](https://img.shields.io/npm/v/@konsumation/db.svg)](https://www.npmjs.com/package/@konsumation/db)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![bundlejs](https://deno.bundlejs.com/?q=@konsumation/db\&badge=detailed)](https://bundlejs.com/?q=@konsumation/db)
[![downloads](http://img.shields.io/npm/dm/@konsumation/db.svg?style=flat-square)](https://npmjs.org/package/@konsumation/db)
[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fkonsumation%2Fkonsum-db%2Fbadge\&style=flat)](https://actions-badge.atrox.dev/konsumation/konsum-db/goto)
[![Styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Known Vulnerabilities](https://snyk.io/test/github/konsumation/konsum-db/badge.svg)](https://snyk.io/test/github/konsumation/konsum-db)

# konsum-db

timeseries database on leveldb

# example

```js
import levelup from "levelup";
import leveldown from "leveldown";

import { Master, Category } from "konsum-db";

async function example() {
 // open database
 const db = await levelup(leveldown("example.db"));
 const master = await Master.initialize(db);

 // create category named EV
 const ev = new Category("EV", master, { unit: "kWh" });
 await ev.write(master.db);
 
 // write entry
 await ev.writeValue(db, Date.now(), 77.34);
}

example();
```

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

*   [Attribute](#attribute)
    *   [Properties](#properties)
*   [definePropertiesFromOptions](#definepropertiesfromoptions)
    *   [Parameters](#parameters)
*   [defaultValues](#defaultvalues)
    *   [Parameters](#parameters-1)
*   [optionJSON](#optionjson)
    *   [Parameters](#parameters-2)
*   [mapAttributes](#mapattributes)
    *   [Parameters](#parameters-3)
*   [mapAttributesInverse](#mapattributesinverse)
    *   [Parameters](#parameters-4)
*   [tokens](#tokens)
    *   [Parameters](#parameters-5)
*   [setAttribute](#setattribute)
    *   [Parameters](#parameters-6)
*   [getAttribute](#getattribute)
    *   [Parameters](#parameters-7)
*   [description](#description)
*   [Base](#base)
    *   [Parameters](#parameters-8)
    *   [Properties](#properties-1)
    *   [key](#key)
    *   [write](#write)
        *   [Parameters](#parameters-9)
    *   [readDetails](#readdetails)
        *   [Parameters](#parameters-10)
    *   [delete](#delete)
        *   [Parameters](#parameters-11)
    *   [keyPrefix](#keyprefix)
    *   [keyPrefixWith](#keyprefixwith)
        *   [Parameters](#parameters-12)
    *   [typeName](#typename)
    *   [attributes](#attributes)
    *   [entries](#entries)
        *   [Parameters](#parameters-13)
    *   [entriesWith](#entrieswith)
        *   [Parameters](#parameters-14)
    *   [entry](#entry)
        *   [Parameters](#parameters-15)
*   [Category](#category)
    *   [Parameters](#parameters-16)
    *   [Properties](#properties-2)
    *   [valueKey](#valuekey)
        *   [Parameters](#parameters-17)
    *   [writeValue](#writevalue)
        *   [Parameters](#parameters-18)
    *   [getValue](#getvalue)
        *   [Parameters](#parameters-19)
    *   [deleteValue](#deletevalue)
        *   [Parameters](#parameters-20)
    *   [values](#values)
        *   [Parameters](#parameters-21)
    *   [readStream](#readstream)
        *   [Parameters](#parameters-22)
    *   [meters](#meters)
        *   [Parameters](#parameters-23)
    *   [notes](#notes)
        *   [Parameters](#parameters-24)
    *   [entries](#entries-1)
        *   [Parameters](#parameters-25)
*   [MASTER](#master)
*   [SCHEMA\_VERSION\_1](#schema_version_1)
*   [SCHEMA\_VERSION\_2](#schema_version_2)
*   [SCHEMA\_VERSION\_CURRENT](#schema_version_current)
*   [CATEGORY\_PREFIX](#category_prefix)
*   [VALUE\_PREFIX](#value_prefix)
*   [unit](#unit)
*   [fractionalDigits](#fractionaldigits)
*   [Master](#master-1)
    *   [Properties](#properties-3)
    *   [close](#close)
    *   [categories](#categories)
        *   [Parameters](#parameters-26)
    *   [backup](#backup)
        *   [Parameters](#parameters-27)
    *   [restore](#restore)
        *   [Parameters](#parameters-28)
    *   [initialize](#initialize)
        *   [Parameters](#parameters-29)
*   [Meter](#meter)
    *   [Parameters](#parameters-30)
    *   [Properties](#properties-4)
*   [Note](#note)
    *   [Parameters](#parameters-31)
*   [secondsAsString](#secondsasstring)
    *   [Parameters](#parameters-32)

## Attribute

Type: [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)

### Properties

*   `type` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
*   `writable` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)**&#x20;
*   `private` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** should the value be shown
*   `depends` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** name of an attribute we depend on
*   `description` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
*   `default` **any?** the default value
*   `set` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)?** set the value
*   `get` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)?** get the value can be used to calculate default values
*   `env` **([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>)?** environment variable use to provide the value

## definePropertiesFromOptions

*   **See**: Object.definedProperties()
*   **See**: Object.getOwnPropertyDescriptor()

Create properties from options and default options.
Already present properties (direct) are skipped.
The attribute list from the class will be applied to the
options and merged with the given set of properties.

```js
class aClass {
  static get attributes() {
    return { with_default: { default: 77 }};
  }
}

definePropertiesFromOptions(new aClass());
// equivalent to
Object.definedProperties(new aClass(),{ with_default: { value: 77 }})
```

### Parameters

*   `object` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** target object
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** as passed to object constructor (optional, default `{}`)
*   `properties` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** object properties (optional, default `{}`)
*   `attributes` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `object.constructor.attributes||[]`)

## defaultValues

Get default values.

### Parameters

*   `attributes` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;
*   `object` &#x20;

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** filled with default values

## optionJSON

Create json based on present options.
In other words only produce key value pairs if value is defined.

### Parameters

*   `object` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;
*   `initial` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
*   `attributes` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** to operator on (optional, default `object.constructor.attributes`)

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** initial + defined values

## mapAttributes

Rename attributes.
Filters out null, undefined and empty strings.

```js
mapAttributes({a:1},{a:"a'"}) // {"a'": 1}
```

### Parameters

*   `object` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;
*   `mapping` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** keys renamed after mapping

## mapAttributesInverse

Same as mapAttributes but with the inverse mapping.
Filters out null, undefined and empty strings

### Parameters

*   `object` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;
*   `mapping` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** keys renamed after mapping

## tokens

Split property path into tokens

### Parameters

*   `string` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;

Returns **Iterator<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>**&#x20;

## setAttribute

Set Object attribute.
The name may be a property path like 'a.b.c'.

### Parameters

*   `object` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
*   `value` **any**&#x20;

## getAttribute

Deliver attribute value.
The name may be a property path like 'a.b.c'.

### Parameters

*   `object` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;

Returns **any** value associated with the given property name

## description

Description of the content.

## Base

Base

### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** meter name
*   `owner` &#x20;
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

    *   `options.description` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
    *   `options.unit` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** physical unit like kWh or m3

### Properties

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** category name
*   `description` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
*   `unit` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** physical unit

### key

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;

### write

*   **See**: {key}

Writes object into database.
Leaves all other entries alone.

#### Parameters

*   `db` **levelup**&#x20;

### readDetails

Get detail objects.

#### Parameters

*   `factory` **Class**&#x20;
*   `db` **levelup**&#x20;
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

    *   `options.gte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** from name
    *   `options.lte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** up to name
    *   `options.reverse` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** order

Returns **Iterator\<factory>**&#x20;

### delete

Delete record from database.

#### Parameters

*   `db` **levelup**&#x20;

### keyPrefix

Prefix of the key

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;

### keyPrefixWith

#### Parameters

*   `object` **[Base](#base)**&#x20;

Returns **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** prefix for a given (master) object

### typeName

Name of the type in text dump

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;

### attributes

Additional attributes to be persisted

### entries

Get instances without owner.

#### Parameters

*   `db` **levelup**&#x20;
*   `prefix` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
*   `gte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** lowest name (optional, default `"\u0000"`)
*   `lte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** highst name (optional, default `"\uFFFF"`)

Returns **AsyncIterator<[Base](#base)>**&#x20;

### entriesWith

Get instances with owner.

#### Parameters

*   `db` **levelup**&#x20;
*   `object` &#x20;
*   `gte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** lowest name (optional, default `"\u0000"`)
*   `lte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** highst name (optional, default `"\uFFFF"`)
*   `owner` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

Returns **AsyncIterator<[Base](#base)>**&#x20;

### entry

Get a single instance.

#### Parameters

*   `db` **levelup**&#x20;
*   `key` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;

Returns **[Base](#base)**&#x20;

## Category

**Extends Base**

Value Category.

### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** category name
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

    *   `options.description` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
    *   `options.unit` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** physical unit like kWh or m3
    *   `options.fractionalDigits` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** display precission

### Properties

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** category name
*   `description` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
*   `unit` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** physical unit
*   `fractionalDigits` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** display precission

### valueKey

Key for a given value.

#### Parameters

*   `time` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** seconds since epoch

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** key

### writeValue

Write a time/value pair.

#### Parameters

*   `db` **levelup**&#x20;
*   `value` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)**&#x20;
*   `time` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** seconds since epoch

### getValue

#### Parameters

*   `db` **levelup**&#x20;
*   `time` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** seconds since epoch

### deleteValue

#### Parameters

*   `db` **levelup**&#x20;
*   `time` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** seconds since epoch

### values

Get values of the category.

#### Parameters

*   `db` **levelup**&#x20;
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

    *   `options.gte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** time of earliest value
    *   `options.lte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** time of latest value
    *   `options.reverse` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** order

Returns **Iterator<[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)>**&#x20;

### readStream

Get values of the category as ascii text stream with time and value on each line.

#### Parameters

*   `db` **levelup**&#x20;
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

    *   `options.gte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** time of earliest value
    *   `options.lte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** time of latest value
    *   `options.reverse` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** order

Returns **Readable**&#x20;

### meters

Get Meters of the category.

#### Parameters

*   `db` **levelup**&#x20;
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

    *   `options.gte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** from name
    *   `options.lte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** up to name
    *   `options.reverse` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** order

Returns **Iterator<[Meter](#meter)>**&#x20;

### notes

Get Notes of the category.

#### Parameters

*   `db` **levelup**&#x20;
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

    *   `options.gte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** time
    *   `options.lte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** up to time
    *   `options.reverse` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** order

Returns **Iterator<[Meter](#meter)>**&#x20;

### entries

Get categories.

#### Parameters

*   `db` **levelup**&#x20;
*   `gte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** lowest name
*   `lte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** highst name

Returns **AsyncIterator<[Category](#category)>**&#x20;

## MASTER

Prefix of the master record

Type: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)

## SCHEMA\_VERSION\_1

Outdated schema version

Type: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)

## SCHEMA\_VERSION\_2

Schema with type + name

Type: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)

## SCHEMA\_VERSION\_CURRENT

Schema version for newly created databases

## CATEGORY\_PREFIX

Prefix of the categories.
Will be followed by the category name

Type: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)

## VALUE\_PREFIX

Prefix of the values.
Will be followed by the category name

Type: [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)

## unit

Physical unit.

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;

## fractionalDigits

Precission

Returns **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)**&#x20;

## Master

**Extends Base**

Master record.
Holds schema version.

### Properties

*   `schemaVersion` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;

### close

Close the underlaying database.

### categories

List Categories.

#### Parameters

*   `gte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
*   `lte` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;

### backup

Copy all data into out stream as long time text data.

#### Parameters

*   `out` **Writeable**&#x20;

### restore

Restore database from input stream.

#### Parameters

*   `input` **Readable** data from backup

### initialize

Initialize database.
checks/writes master record.

#### Parameters

*   `db` **levelup**&#x20;

Returns **[Master](#master)**&#x20;

## Meter

**Extends Base**

Meter

### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** meter name
*   `category` **[Category](#category)**&#x20;
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**&#x20;

    *   `options.description` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
    *   `options.unit` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** physical unit like kWh or m3
    *   `options.fractionalDigits` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** display precission

### Properties

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** category name
*   `description` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**&#x20;
*   `unit` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** physical unit
*   `fractionalDigits` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** display precission

## Note

**Extends Base**

Hints placed on a category at a specific time.

### Parameters

*   `time` &#x20;
*   `owner` &#x20;
*   `options` &#x20;

## secondsAsString

Format seconds as string left padded with '0'.

### Parameters

*   `seconds` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** seconds since epoch

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** padded seconds
