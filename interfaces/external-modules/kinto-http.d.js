declare module "kinto-http" {
  declare type Options = Object;
  declare type PermissionType =
      "write"
    | "read"
    | "bucket:create"
    | "group:create"
    | "collection:create"
    | "record:create";
  declare type Principal = string;
  declare type Permissions = {[key: PermissionType]: Principal[]};
  declare type BatchResultAggregate = {
    errors: Object[],
  };

  declare type Resource = {
    id: string,
    last_modified: number,
    [key: string]: any,
  };

  declare type ObjectResponseBody<T> = {
    data: T,
    permissions: Permissions,
  };

  declare type ListResponseBody<T> = {
    data: T[],
  };

  declare type BatchResponse = {
    status: number,
    body: Object,
    headers: Object,
  };

  declare type PermissionEntry = {
    resource_name: "bucket" | "group" | "collection" | "record",
    id: string,
    bucket_id: string,
    collection_id?: string,
    permissions: string[],
  };

  declare type ListRecordsOptions = {
    sort?: string,
    limit?: number,
    since?: string,
    at?: number,
    pages?: number,
    filters?: Object,
  };

  declare type ServerInfo = {
    url: string,
    project_name: string,
    project_docs: string,
    capabilities: Object,
    user?: {
      id: string,
      principals: string[],
      bucket?: string,
    },
  };

  declare class KintoClient {
    remote: string;
    defaultReqOptions: {
      headers: Object
    };
    constructor(remote: string, options: Options): void;
    bucket(bucketId: string): Bucket;
    createBucket(id: ?string, options?: Options): Promise<ObjectResponseBody<Resource>>;
    deleteBucket(id: string, options?: Options): Promise<ObjectResponseBody<Resource>>;
    batch(batchFn: (batch: KintoClient) => void): Promise<BatchResponse[]>;
    fetchServerInfo(): Promise<ServerInfo>;
    listBuckets(): Promise<ListResponseBody<Resource>>;
    listPermissions(): Promise<ListResponseBody<PermissionEntry>>;
  }

  declare class Bucket {
    constructor(): void;
    collection(collectionId: string): Collection;
    getData(): Promise<Resource>;
    setData(data: Object, options?: Options): Promise<ObjectResponseBody<Resource>>;
    setPermissions(permissions: Permissions): Promise<ObjectResponseBody<Resource>>;
    createCollection(id: ?string, options?: Options): Promise<ObjectResponseBody<Resource>>;
    deleteCollection(id: string, options?: Options): Promise<ObjectResponseBody<Resource>>;
    listCollections(options?: Options): Promise<ListResponseBody<Resource>>;
    getCollectionsTimestamp(): Promise<string>;
    listHistory(options: Options): Promise<ListResponseBody<Object>>;
    listGroups(): Promise<ListResponseBody<Resource>>;
    getGroupsTimestamp(): Promise<string>;
    getGroup(id: string, options?: Options): Promise<ListResponseBody<Resource>>;
    createGroup(id: ?string, members: string[], options?: Options): Promise<ObjectResponseBody<Resource>>;
    updateGroup(group: Object, options?: Options): Promise<ObjectResponseBody<Resource>>;
    deleteGroup(id: string, options?: Options): Promise<ObjectResponseBody<Resource>>;
  }

  declare class Collection {
    constructor(): void;
    getData(): Promise<Resource>;
    setData(data: Object, options?: Options): Promise<ObjectResponseBody<Resource>>;
    setPermissions(permissions: Permissions): Promise<ObjectResponseBody<Resource>>;
    removeAttachment(): Promise<ObjectResponseBody<Resource>>;
    listRecords(options: ListRecordsOptions): Promise<ListResponseBody<Resource>>;
    getRecordsTimestamp(): Promise<string>;
    getTotalRecords(options?: Object): Promise<number>;
    addAttachment(attachment: string, record: Object, options?: Options): Promise<ObjectResponseBody<Resource>>;
    getRecord(rid: string, options?: Options): Promise<ObjectResponseBody<Resource>>;
    createRecord(record: Object, options?: Options): Promise<ObjectResponseBody<Resource>>;
    updateRecord(record: Object, options?: Options): Promise<ObjectResponseBody<Resource>>;
    deleteRecord(id: string, options?: Options): Promise<ObjectResponseBody<Resource>>;
    batch(batchFn: (batch: Collection) => void, options: Options): Promise<BatchResultAggregate>;
  }

  declare module.exports: typeof KintoClient
}

declare module "kinto-http/lib/endpoint" {
  declare function endpoint(): string;
  declare module.exports: { endpoint: typeof endpoint };
}

declare module "kinto-http/lib/utils" {
  declare function checkVersion(
    version: string,
    minVersion: string,
    maxVersion: string
  ): boolean;
}
