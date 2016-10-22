import { assert } from 'chai';
import { Immute } from '../src/index';

describe('Immute', () => {
    describe('#get() - Get a new version of the internal object', function () {
        var orig = {a: 1, b: {c: 3, d: [1, 2]}};
        var immute = new Immute(orig);
        var newObj = immute.get();
        it('should return a new object', function (done) {
            assert(orig != newObj);
            done();
        });
        it('mutations on original object do not mutate export object', function (done) {
            orig.b.d.push(3);
            assert(newObj.b.d.length == 2, 'Array mutated');
            orig.b.c = 5;
            assert(newObj.b.c == 3, 'Deep object mutated internally');
            done();
        });
        it('mutations on exported object do not mutate new export object', function (done) {
            immute.get().b.c = 4;
            assert(immute.get().b.c == 3, 'Deep object mutated ' + immute.get().b.c);
            done();
        });
    });
    describe('#set() - create a new object and set the value by path', function () {
        var orig = {a: 1, b: {c: 3, d: [1, 2]}};
        var immute = new Immute(orig);
        it('should update container object by path', function (done) {
            var newArray = [4];
            immute.set('b.d', newArray);
            assert(immute.get().b.d.length == 1, 'd was not updated');
            assert(immute.set('b.c', 7).get().b.c == 7, 'c was not updated')
            done();
        });
        it('updates to container should not mutate original object', function (done) {
            immute.set('b.d', [5, 6, 7]);
            assert(orig.b.d.length == 2, 'original was updated');
            done();
        });
        it('should update array values by position', function(done){
            immute.set('x', {y: ['a', 'b', 'c']});
            immute.set('x.y.1', 'bb');
            immute.set('x.y.0', 'aa');
            assert(immute.get().x.y[0] == 'aa', 'not updated by position');
            assert(immute.get().x.y[1] == 'bb', 'not updated by position');
            done();

        });
        it('should update array object value by array position', function(done) {
            immute.set('y', {x: [{a: 'y'}, {b: 'z'}]});
            immute.set('y.x.1.b', 'zz');
            assert(immute.get().y.x[1].b == 'zz', 'array object not updated');
            done();
        });
    })
    describe('#on() - run callbacks based on path update', function () {

        var immute = new Immute({});

        var donkey = immute => response =>
            immute.set('donkey', response.donkey);

        var lion = immute => response =>
            immute.set('lion', response.lion);

        var monkey = immute => response =>
            immute.set('monkey', response.monkey);

        var footer = immute => footer =>
            immute.set('footer', footer);

        it('should allow setting a single event callback', function (done) {
            immute.on('response', donkey(immute));
            done();
        })
        it('should allow setting a list of event callbacks', function (done) {
            immute.on('response', [lion(immute), monkey(immute)]);
            done();
        })
        it('should trigger path events when the path is set', function (done) {
            var state = immute.set('response', {
                donkey: 1,
                lion: 2,
                monkey: 3
            }).get();
            assert(state.donkey == 1);
            assert(state.lion == 2);
            assert(state.monkey == 3);
            done();
        });
        it('should trigger events of items deep within an object', function(done) {
            immute.on('response.donkey', footer(immute));
            var state = immute.set('response.donkey', 'hello').get();
            assert(state.response.donkey == 'hello');
            done();

        });
        it('should trigger child events when the parent is updated', function(done) {
            var state = immute.set('response', {
                donkey: 'goodbye',
                lion: 4,
                monkey: 5
            }).get();
            assert(state.donkey == 'goodbye');
            done();
        });

    })
});
