import { expect } from "chai";
import { updatePath } from "redux-simple-router";
import { take, fork, put, call } from "redux-saga/effects";

import {
  COLLECTION_LOAD_REQUEST,
  COLLECTION_CREATE_REQUEST,
  COLLECTION_UPDATE_REQUEST,
  COLLECTION_DELETE_REQUEST,
} from "../../scripts/constants";
import { notifyError, notifySuccess } from "../../scripts/actions/notifications";
import * as collectionActions from "../../scripts/actions/collection";
import * as actions from "../../scripts/actions/bucket";
import { listBuckets } from "../../scripts/sagas/session";
import * as saga from "../../scripts/sagas/bucket";
import { setClient } from "../../scripts/client";


const collectionData = {
  schema: {},
  uiSchema: {},
  displayFields: [],
};

describe("bucket sagas", () => {
  describe("loadCollection()", () => {
    describe("Success", () => {
      let bucket, collection, loadCollection;

      before(() => {
        collection = {getAttributes() {}};
        bucket = {collection() {return collection;}};
        setClient({bucket() {return bucket;}});
        loadCollection = saga.loadCollection("bucket", "collection");
      });

      it("should mark the current collection as busy", () => {
        expect(loadCollection.next().value)
          .eql(put(collectionActions.collectionBusy(true)));
      });

      it("should fetch collection attributes", () => {
        expect(loadCollection.next().value)
          .eql(call([collection, collection.getAttributes]));
      });

      it("should dispatch the collectionLoadSuccess action", () => {
        expect(loadCollection.next({data: collectionData}).value)
          .eql(put(collectionActions.collectionLoadSuccess({
            ...collectionData,
            bucket: "bucket",
            label: "bucket/collection",
          })));
      });

      it("should unmark the current collection as busy", () => {
        expect(loadCollection.next().value)
          .eql(put(collectionActions.collectionBusy(false)));
      });
    });

    describe("Failure", () => {
      let loadCollection;

      before(() => {
        loadCollection = saga.loadCollection("bucket", "collection");
        loadCollection.next();
        loadCollection.next();
      });

      it("should dispatch an error notification action", () => {
        expect(loadCollection.throw("error").value)
          .eql(put(notifyError("error")));
      });

      it("should unmark the current collection as busy", () => {
        expect(loadCollection.next().value)
          .eql(put(collectionActions.collectionBusy(false)));
      });
    });
  });

  describe("createCollection()", () => {
    describe("Success", () => {
      let bucket, createCollection;

      before(() => {
        bucket = {createCollection() {}};
        setClient({bucket() {return bucket;}});
        createCollection = saga.createCollection("bucket", {
          ...collectionData,
          name: "collection",
        });
      });

      it("should post the collection data", () => {
        expect(createCollection.next().value)
          .eql(call([bucket, bucket.createCollection], "collection", {
            data: collectionData
          }));
      });

      it("should update the route path", () => {
        expect(createCollection.next().value)
          .eql(put(updatePath("/buckets/bucket/collections/collection")));
      });

      it("should dispatch a notification", () => {
        expect(createCollection.next().value)
          .eql(put(notifySuccess("Collection created.")));
      });

      it("should reload the list of buckets/collections", () => {
        expect(createCollection.next().value)
          .eql(call(listBuckets));
      });
    });

    describe("Failure", () => {
      let createCollection;

      before(() => {
        const bucket = {createCollection() {}};
        setClient({bucket() {return bucket;}});
        createCollection = saga.createCollection("bucket", {
          ...collectionData,
          name: "collection",
        });
        createCollection.next();
      });

      it("should dispatch an error notification action", () => {
        expect(createCollection.throw("error").value)
          .eql(put(notifyError("error")));
      });
    });
  });

  describe("updateCollection()", () => {
    describe("Success", () => {
      let bucket, collection, updateCollection;

      before(() => {
        collection = {setMetadata() {}};
        bucket = {collection() {return collection;}};
        setClient({bucket() {return bucket;}});
        updateCollection = saga.updateCollection(
          "bucket", "collection", collectionData);
      });

      it("should post the collection data", () => {
        expect(updateCollection.next().value)
          .eql(call([collection, collection.setMetadata], collectionData));
      });

      it("should dispatch the collectionLoadSuccess action", () => {
        expect(updateCollection.next({data: collectionData}).value)
          .eql(put(collectionActions.collectionLoadSuccess({
            ...collectionData,
            bucket: "bucket",
            label: "bucket/collection",
          })));
      });

      it("should dispatch a notification", () => {
        expect(updateCollection.next().value)
          .eql(put(notifySuccess("Collection properties updated.")));
      });
    });

    describe("Failure", () => {
      it("should dispatch an error notification action", () => {
        const updateCollection = saga.updateCollection(
          "bucket", "collection", collectionData);
        updateCollection.next();

        expect(updateCollection.throw("error").value)
          .eql(put(notifyError("error")));
      });
    });
  });

  describe("deleteCollection()", () => {
    describe("Success", () => {
      let bucket, deleteCollection;

      before(() => {
        bucket = {deleteCollection() {}};
        setClient({bucket() {return bucket;}});
        deleteCollection = saga.deleteCollection("bucket", "collection");
      });

      it("should delete the collection", () => {
        expect(deleteCollection.next().value)
          .eql(call([bucket, bucket.deleteCollection], "collection"));
      });

      it("should update the route path", () => {
        expect(deleteCollection.next().value)
          .eql(put(updatePath("")));
      });

      it("should dispatch a notification", () => {
        expect(deleteCollection.next().value)
          .eql(put(notifySuccess("Collection deleted.")));
      });

      it("should reload the list of buckets/collections", () => {
        expect(deleteCollection.next().value)
          .eql(call(listBuckets));
      });
    });

    describe("Failure", () => {
      let deleteCollection;

      before(() => {
        deleteCollection = saga.deleteCollection("bucket", "collection");
        deleteCollection.next();
      });

      it("should dispatch an error notification action", () => {
        expect(deleteCollection.throw("error").value)
          .eql(put(notifyError("error")));
      });
    });
  });

  describe("Watchers", () => {
    describe("watchCollectionLoad()", () => {
      it("should watch for the loadCollection action", () => {
        const watchCollectionLoad = saga.watchCollectionLoad();

        expect(watchCollectionLoad.next().value)
          .eql(take(COLLECTION_LOAD_REQUEST));

        expect(watchCollectionLoad.next(actions.loadCollection("a", "b")).value)
          .eql(fork(saga.loadCollection, "a", "b"));
      });
    });

    describe("watchCollectionCreate()", () => {
      it("should watch for the createCollection action", () => {
        const watchCollectionCreate = saga.watchCollectionCreate();

        expect(watchCollectionCreate.next().value)
          .eql(take(COLLECTION_CREATE_REQUEST));

        expect(watchCollectionCreate.next(
          actions.createCollection("a", "b")).value)
          .eql(fork(saga.createCollection, "a", "b"));
      });
    });

    describe("watchCollectionUpdate()", () => {
      it("should watch for the updateCollection action", () => {
        const watchCollectionUpdate = saga.watchCollectionUpdate();

        expect(watchCollectionUpdate.next().value)
          .eql(take(COLLECTION_UPDATE_REQUEST));

        expect(watchCollectionUpdate.next(
          actions.updateCollection("a", "b", "c")).value)
          .eql(fork(saga.updateCollection, "a", "b", "c"));
      });
    });

    describe("watchCollectionDelete()", () => {
      it("should watch for the deleteCollection action", () => {
        const watchCollectionDelete = saga.watchCollectionDelete();

        expect(watchCollectionDelete.next().value)
          .eql(take(COLLECTION_DELETE_REQUEST));

        expect(watchCollectionDelete.next(
          actions.deleteCollection("a", "b")).value)
          .eql(fork(saga.deleteCollection, "a", "b"));
      });
    });
  });
});
