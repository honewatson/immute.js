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
    })
    describe('#on() - run callbacks based on path update', function () {

        var immute = new Immute({});

        var breadcrumbs = immute => response =>
            immute.set('breadcrumbs', response.breadcrumbs);

        var facets = immute => response =>
            immute.set('facets', response.facets);

        var content = immmute => response =>
            immute.set('content', response.content);

        var footer = immmute => footer =>
            immute.set('footer', footer);

        it('should allow setting a single event callback', function (done) {
            immute.on('response', breadcrumbs(immute));
            done();
        })
        it('should allow setting a list of event callbacks', function (done) {
            immute.on('response', [facets(immute), content(immute)]);
            done();
        })
        it('should trigger path events when the path is set', function (done) {
            var state = immute.set('response', {
                breadcrumbs: 1,
                facets: 2,
                content: 3
            }).get();
            assert(state.breadcrumbs == 1);
            assert(state.facets == 2);
            assert(state.content == 3);
            done();
        });
        it('should trigger events of items deep within an object', function(done) {
            immute.on('response.breadcrumbs', footer(immute));
            var state = immute.set('response.breadcrumbs', 'hello').get();
            assert(state.response.breadcrumbs == 'hello');
            done();

        });
        it('should trigger child events when the parent is updated', function(done) {
            var state = immute.set('response', {
                breadcrumbs: 'goodbye',
                facets: 4,
                content: 5
            }).get();
            assert(state.breadcrumbs == 'goodbye');
            done();
        });

    })
});