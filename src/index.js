/**
 * Determine if the value is an object
 * @param item
 */
const isObject = item =>
    item && typeof item === 'object' && !Array.isArray(item) && item !== null && typeof item != 'undefined';

/**
 * Convert to number if the value is an number
 * @param val
 */
const maybeInt = val =>
    Number.isInteger(parseInt(val)) ? parseInt(val) : val;

/**
 * Immutable Clone
 * @param obj
 */
const clone = obj => {
    var nobj = JSON.stringify(obj);
    return JSON.parse(nobj);

}

/**
 * Create a new object by adding or replacing the values of target with source
 * @example
 * // returns {a: 2, b: 2, c:3}
 * merge({a:1, b:2, c:3}, {a:2})
 * @param target
 * @param source
 * @returns {*}
 */
const merge = (target: object, source: object) => {
    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, {[key]: source[key]});
                else
                    output[key] = merge(target[key], source[key]);
            } else {
                let val = typeof source[key] != 'undefined' ? source[key] : target[key];
                Object.assign(output, {[key]: val});
            }
        });
    }
    return output;
}

/**
 * Get the value of the object based on the path
 * @example
 * // returns 1
 * getDescendantValue('x.y.z', {x: {y: { z: 1} } })
 * @param obj
 * @param desc
 * @returns {object:null}
 */
const getDescendantValue = (path: string, obj: object) => {
    var arr = path.split(".");
    while (arr.length && (obj = obj[arr.shift()]));
    return typeof obj != 'undefined' ? obj : null;
}

/**
 *
 * Create a new object and set the value by path of the new object
 * @example
 * // returns {x: {y: { z: 2 } } }
 * setFromPath('x.y.z', 2, {x: {y: { z: 1} } })
 * @param obj
 * @param path
 * @param value
 */
const setFromPath = (path, value, obj) => {
    function setDepth(objx, path, value) {
        var tags = path.split("."), len = tags.length - 1;
        for (var i = 0; i < len; i++) {
            objx = objx[tags[i]];
        }
        objx[tags[len]] = value;
    }
    let nobj = clone(obj)
    setDepth(nobj, path, clone(value));
    return nobj;
}

/**
 * Creates an array from path
 * @param path
 */
const arrayObjects = (path: string) =>
    path.split('.')
        .map(function keyInfo(key, index, arr) {
            let next = maybeInt((index + 1) <= arr.length ? arr[index + 1] : null);
            let prev = maybeInt(index > 0 ? arr[index - 1] : null);
            let value = !!next && Number.isInteger(parseInt(next)) ? [] : {};
            key = maybeInt(key);
            return {key, next, prev, value}
        })

/**
 * Creates a skeleton object with properties and no values
 * @param arrObjects
 */
const skeleton = arrObjects =>
    arrObjects.reduce(function reduceToObj(accum, currentValue, index, arr) {
        if(index === 0) {
            accum[currentValue.key] = currentValue.value;
        }
        else if (index < arr.length - 1) {
            let count = 1;
            let obj = accum[arr[0].key];
            while(count < index) {
                obj = accum[arr[count].key];
                count++;
            }
            obj[currentValue.key] = currentValue.value;
        }
        return accum;
    }, {});

/**
 * Creates a subObj of an object based on the path
 * @param path
 * @param obj
 */
const subObj = (path: string, obj: object) => {
    let arrObjects = arrayObjects(path);
    let init = setFromPath(path, getDescendantValue(path, obj), skeleton(arrObjects));
    let currentObj;
    let currentRefObj;
    arrObjects.forEach(function preItems(item, index) {
        if(!currentObj) {
            currentObj = init[item.path];
            currentRefObj = obj[item.path];
        }
        else {
            currentObj =  currentObj[item.path];
            currentRefObj = currentRefObj[item.path];
        }
        if(Number.isInteger(item.next) && item.next > 0) {
            let count = 0;
            while(count < item.next) {
                let refVar = currentRefObj[count];
                refVar = isObject(refVar) ? clone(refVar) : refVar;
                currentObj[count] = currentRefObj[count];
                count++;
            }

        }
    })
    return init;
}

/**
 * An object which includes the path of an object and the callback associated with that path
 */
class EventPath {
    path: string;
    
    constructor (path: string, callback) {
        this.path = path;
        this.callback = callback;
    }
}

/**
 * Don't double add EventPaths
 * This probably doesn't work
 * @param list
 * @param callback
 */
const uniqueEventPaths = (list, callback) =>
    Array.from(new Set(list.concat(callback)));

/**
 * Immutable data container with events
 */
class Immute {

    /**
     *
     * @param obj The initial object
     * @param model A model with business logic that can be accessed by events
     * @param events Pre generated events
     */
    constructor(obj: object, model = {}, events = {}) {
        this._obj = clone(obj);
        this._model = model;
        this._events = events;
    }

    /**
     * @return A new object of the source object
     */
    get() {
        return clone(this._obj);
    }

    /**
     * Call all events with the path of this._obj
     * @param path
     * @param value
     */
    event(path: string, value = null) {
        if(typeof this._events[path] != 'undefined') {
            this._events[path].forEach(eventPath => {
                if(value == null) {
                    value = clone(getDescendantValue(eventPath.path, this._obj));
                }
                eventPath.callback(value, this.get(), this._model, eventPath.path);
            })
        }
    }

    /**
     * Update the immutable object with the value provided for the path
     * @param path
     * @param value
     * @return {Immute}
     */
    set(path: string, value) {
        this._obj = setFromPath(path, value, this._obj)
        this.event(path);
        return this;
    }

    /**
     * Add event to the events object
     * @param path
     * @param callback
     * @private
     */
    _setEvent(path: string, callback) {

        if (typeof this._events[path] == 'undefined') {
            this._events[path] = [callback];
        }
        else {
            this._events[path] = uniqueEventPaths(this._events[path], callback)
        }

    }

    /**
     * Add an event to trigger for the path plus parent updates
     * @param path
     * @param callbacks
     * @param init
     * @return {Immute}
     */
    on(path: string, callbacks, init = null) {
        if(!Array.isArray(callbacks)) {
            callbacks = [callbacks];
        }
        callbacks.forEach(callback => {
            let parts = path.split('.'), partsn = [].concat(parts);
            partsn.forEach(part => {
                let npath = parts.join(".");
                this._setEvent(npath, new EventPath(path, callback));
                parts.pop();
            })
            if(init == true) {
                callback(getDescendantValue(path, this._obj));
            }
            else if (init != null) {
                callback(init);
            }
        })

        return this;
    }

    /**
     * Trigger an event with the path using the value
     * @param path
     * @param value
     */
    trigger(path: string, value) {
        this.event(path, value);
    }

}

module.exports = {
    clone,
    merge,
    getDescendantValue,
    setFromPath,
    arrayObjects,
    skeleton,
    subObj,
    Immute
}



