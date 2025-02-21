import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Profile: a
    .model({
      firstName: a.string().required(),
      lastName: a.string().required(),
      description: a.string(),
      bio: a.string(),
      photoUrl: a.string(),
      photoKey: a.string(),
      // Add relationships
      insights: a.hasMany('Insight', 'profileID'),
      profileGroups: a.hasMany('ProfileGroup', 'profileID'),
      owner: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => allow.owner()),

  Group: a
    .model({
      name: a.string().required(),
      type: a.string().required(),
      description: a.string(),
      memberCount: a.integer(),
      // Add relationships
      profileGroups: a.hasMany('ProfileGroup', 'groupID'),
      owner: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => allow.owner()),

  // Join table for Profile-Group many-to-many relationship
  ProfileGroup: a
    .model({
      profileID: a.string(),
      groupID: a.string(),
      profile: a.belongsTo('Profile', 'profileID'),
      group: a.belongsTo('Group', 'groupID'),
      joinedDate: a.datetime(),
      owner: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => allow.owner()),

  Insight: a
    .model({
      text: a.string().required(),
      timestamp: a.datetime().required(),
      profileID: a.string(),
      profile: a.belongsTo('Profile', 'profileID'),
      owner: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => allow.owner()),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
