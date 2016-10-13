import React, { Component } from "react";

import Spinner from "../Spinner";
import GroupForm from "./GroupForm";
import GroupTabs from "./GroupTabs";


export default class GroupEdit extends Component {
  onSubmit = (formData) => {
    const {params, updateGroup} = this.props;
    const {bid, gid} = params;
    updateGroup(bid, gid, {data: formData});
  };

  deleteGroup = (gid) => {
    const {deleteGroup, params} = this.props;
    const {bid} = params;
    if (confirm("This will delete the group. Are you sure?")) {
      deleteGroup(bid, gid);
    }
  };

  render() {
    const {params, session, bucket, group, capabilities} = this.props;
    const {bid, gid} = params;
    const {busy, data: formData} = group;
    if (busy) {
      return <Spinner />;
    }
    return (
      <div>
        <h1>Edit <b>{bid}/{gid}</b> group properties</h1>
        <GroupTabs
          bid={bid}
          gid={gid}
          selected="settings"
          capabilities={capabilities}>
          <GroupForm
            bid={bid}
            gid={gid}
            session={session}
            bucket={bucket}
            group={group}
            deleteGroup={this.deleteGroup}
            formData={formData}
            onSubmit={this.onSubmit} />
        </GroupTabs>
      </div>
    );
  }
}