describe("pie.list", function() {

  beforeEach(function() {
    this.items = pie.list.create(['a', 'b', 'c', 'd']);
  });

  it("should properly determine length", function() {
    expect(this.items.length()).toEqual(4);
    this.items.data.items.push(0);
    expect(this.items.length()).toEqual(5);
  });

  it("should allow an element to be retrieved from positive indexes", function() {
    expect(this.items.get(0)).toEqual('a');
    expect(this.items.get(3)).toEqual('d');
    expect(this.items.get(4)).toEqual(undefined);
  });

  it("should allow an element to be retrieved from negative indexes", function() {
    expect(this.items.get(-1)).toEqual('d');
    expect(this.items.get(-4)).toEqual('a');
    expect(this.items.get(-5)).toEqual(undefined);
  });

  it("should allow other attributes to be set and retrieved", function() {
    this.items.set('foo', 'bar');
    expect(this.items.length()).toEqual(4);
    expect(this.items.get('foo')).toEqual('bar');
  });

  it("should allow values to be cast into the desired casting class", function() {
    var items = pie.list.create([{foo: 'bar'}, {baz: 'bar'}], {cast: true});
    var m = items.get(0);

    expect(m.__pieRole).toEqual('model');
    expect(m.get('foo')).toEqual('bar');

    m = items.get(1);
    expect(m.__pieRole).toEqual('model');
    expect(m.get('baz')).toEqual('bar');

    items.push({tar: 'ball'});
    m = items.get(2);
    expect(m.__pieRole).toEqual('model');
    expect(m.get('tar')).toEqual('ball');
  });

  describe("data manipulation via", function() {

    beforeEach(function(){
      this.changes = [];
      this.items.observe(function(changes){
        this.changes = changes;
      }.bind(this));
    });


    describe("#insert", function() {
      it("should add a value at a specific index, increasing the length of the list", function() {
        this.items.insert(1, 'foo');
        expect(this.items.get(1)).toEqual('foo');
        expect(this.items.get(2)).toEqual('b');
        expect(this.items.length()).toEqual(5);
      });

      it("should deliver a change record for the inserted index and the length", function() {
        this.items.insert(1, 'foo');
        expect(this.changes.length).toEqual(4);

        expect(this.changes[0].type).toEqual('add');
        expect(this.changes[0].name).toEqual('1');
        expect(this.changes[0].oldValue).toEqual('b');
        expect(this.changes[0].value).toEqual('foo');

        expect(this.changes[1].type).toEqual('update');
        expect(this.changes[1].name).toEqual('length');
        expect(this.changes[1].oldValue).toEqual(4);
        expect(this.changes[1].value).toEqual(5);
      });
    });


    describe("#push", function() {
      it("should add a value at the end of the list, increasing the length of the list", function() {
        this.items.push('foo');
        expect(this.items.get(-2)).toEqual('d');
        expect(this.items.get(-1)).toEqual('foo');
        expect(this.items.length()).toEqual(5);
      });

      it("should deliver a change record for the new index and the length", function() {
        this.items.push('foo');
        expect(this.changes.length).toEqual(4);

        expect(this.changes[0].type).toEqual('add');
        expect(this.changes[0].name).toEqual('4');
        expect(this.changes[0].oldValue).toEqual(undefined);
        expect(this.changes[0].value).toEqual('foo');

        expect(this.changes[1].type).toEqual('update');
        expect(this.changes[1].name).toEqual('length');
        expect(this.changes[1].oldValue).toEqual(4);
        expect(this.changes[1].value).toEqual(5);
      });
    });


    describe("#remove", function() {
      it("should remove the value at a specific index, changing the length of the list", function() {
        this.items.remove(1);
        expect(this.items.get(0)).toEqual('a');
        expect(this.items.get(1)).toEqual('c');
        expect(this.items.length()).toEqual(3);
      });

      it("should deliver a change record for the removal and the length change", function() {
        this.items.remove(1);
        expect(this.changes.length).toEqual(4);

        expect(this.changes[0].type).toEqual('delete');
        expect(this.changes[0].name).toEqual('1');
        expect(this.changes[0].oldValue).toEqual('b');
        expect(this.changes[0].value).toEqual('c');

        expect(this.changes[1].type).toEqual('update');
        expect(this.changes[1].name).toEqual('length');
        expect(this.changes[1].oldValue).toEqual(4);
        expect(this.changes[1].value).toEqual(3);
      });
    });


    describe("#set", function() {

      it("should change the value at an existing index", function() {
        this.items.set(1, 'foo');
        expect(this.items.get(1)).toEqual('foo');
        expect(this.items.length()).toEqual(4);
      });

      it("should notify observers of a change at the index but not a change in length", function(){
        this.items.set(1, 'foo');
        expect(this.changes.length).toEqual(3);
        expect(this.changes[0].type).toEqual('update');
        expect(this.changes[0].name).toEqual('1');
      });

      it("should allow the entire list to be set", function() {
        this.items.set('items', ['e', 'f', 'g', 'h', 'i', 'j']);
        expect(this.changes.length).toEqual(9); // 6, one for each index, 1 for items, 1 for the length, and 1 for the _version;

        expect(this.changes[0].name).toEqual('0');
        expect(this.changes[0].type).toEqual('update');

        expect(this.changes[3].name).toEqual('3');
        expect(this.changes[3].type).toEqual('update');

        expect(this.changes[4].name).toEqual('4');
        expect(this.changes[4].type).toEqual('add');

        expect(this.changes[5].name).toEqual('5');
        expect(this.changes[5].type).toEqual('add');

        expect(this.changes[6].name).toEqual('length');
        expect(this.changes[6].type).toEqual('update');
        expect(this.changes[6].oldValue).toEqual(4);
        expect(this.changes[6].value).toEqual(6);

        expect(this.changes[7].name).toEqual('items');
        expect(this.changes[7].type).toEqual('update');

        expect(this.changes[8].name).toEqual('_version');
        expect(this.changes[8].type).toEqual('update');
        expect(this.changes[8].oldValue).toEqual(1);
        expect(this.changes[8].value).toEqual(2);


        this.items.set('items', ['m', 'n', 'o', 'x', 'y', 'z']);

        expect(this.changes.length).toEqual(8); // 6, one for each index, 1 for items, and 1 for the _version;

        expect(this.changes[0].name).toEqual('0');
        expect(this.changes[0].type).toEqual('update');

        expect(this.changes[5].name).toEqual('5');
        expect(this.changes[5].type).toEqual('update');

        expect(this.changes[6].name).toEqual('items');
        expect(this.changes[6].type).toEqual('update');

        expect(this.changes[7].name).toEqual('_version');
        expect(this.changes[7].type).toEqual('update');
        expect(this.changes[7].oldValue).toEqual(2);
        expect(this.changes[7].value).toEqual(3);


        this.items.set('items', ['q', 'r', 's']);

        expect(this.changes.length).toEqual(9); // 6, one for each index, 1 for items, 1 for the length, and 1 for the _version;

        expect(this.changes[0].name).toEqual('5');
        expect(this.changes[0].type).toEqual('delete');

        expect(this.changes[2].name).toEqual('3');
        expect(this.changes[2].type).toEqual('delete');

        expect(this.changes[3].name).toEqual('2');
        expect(this.changes[3].type).toEqual('update');

        expect(this.changes[5].name).toEqual('0');
        expect(this.changes[5].type).toEqual('update');

        expect(this.changes[6].name).toEqual('length');
        expect(this.changes[6].type).toEqual('update');
        expect(this.changes[6].oldValue).toEqual(6);
        expect(this.changes[6].value).toEqual(3);

        expect(this.changes[7].name).toEqual('items');
        expect(this.changes[7].type).toEqual('update');

        expect(this.changes[8].name).toEqual('_version');
        expect(this.changes[8].type).toEqual('update');
        expect(this.changes[8].oldValue).toEqual(3);
        expect(this.changes[8].value).toEqual(4);

      });



    });


    describe("#shift", function() {
      it("should remove the value at the beginning of the list, changing the length of the list", function() {
        this.items.shift();
        expect(this.items.get(0)).toEqual('b');
        expect(this.items.length()).toEqual(3);
      });

      it("should deliver a change record for the removal and the length change", function() {
        this.items.shift();
        expect(this.changes.length).toEqual(4);

        expect(this.changes[0].type).toEqual('delete');
        expect(this.changes[0].name).toEqual('0');
        expect(this.changes[0].oldValue).toEqual('a');
        expect(this.changes[0].value).toEqual('b');

        expect(this.changes[1].type).toEqual('update');
        expect(this.changes[1].name).toEqual('length');
        expect(this.changes[1].oldValue).toEqual(4);
        expect(this.changes[1].value).toEqual(3);
      });
    });


    describe("#unshift", function() {
      it("should add a value at the beginning of the list, increasing the length of the list", function() {
        this.items.unshift('foo');
        expect(this.items.get(0)).toEqual('foo');
        expect(this.items.get(1)).toEqual('a');
        expect(this.items.length()).toEqual(5);
      });

      it("should deliver a change record for the 0 index and the length", function() {
        this.items.unshift('foo');
        expect(this.changes.length).toEqual(4);

        expect(this.changes[0].type).toEqual('add');
        expect(this.changes[0].name).toEqual('0');
        expect(this.changes[0].oldValue).toEqual('a');
        expect(this.changes[0].value).toEqual('foo');

        expect(this.changes[1].type).toEqual('update');
        expect(this.changes[1].name).toEqual('length');
        expect(this.changes[1].oldValue).toEqual(4);
        expect(this.changes[1].value).toEqual(5);
      });
    });

  });

});
