/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {
  Client,
  IAttributeScores,
} from "@conversationai/perspectiveapi-js-client";

import config from "./config";

// Initialize the Firebase Admin SDK
admin.initializeApp();

export const fsAnalyzeCommentsOnCreate = functions.handler.firestore.document.onCreate(
  async (change): Promise<void> => {
    functions.logger.log(
      "Started execution of fsAnalyzeCommentsCreate with configuration",
      config
    );
    if (config.inputFieldName == config.outputFieldName) {
      functions.logger.log(
        "Input field name must not equal output field name."
      );
      return;
    }
    try {
      await handleCreateDocument(change);
    } catch (err) {
      functions.logger.error(err);
    }
  }
);

export const fsAnalyzeCommentsOnUpdate = functions.handler.firestore.document.onUpdate(
  async (change): Promise<void> => {
    functions.logger.log(
      "Started execution of fsAnalyzeCommentsUpdate with configuration",
      config
    );
    if (config.inputFieldName == config.outputFieldName) {
      functions.logger.log(
        "Input field name must not equal output field name."
      );
      return;
    }
    try {
      await handleUpdateDocument(change.before, change.after);
    } catch (err) {
      functions.logger.error(err);
    }
  }
);

const handleCreateDocument = async (
  snapshot: admin.firestore.DocumentSnapshot
): Promise<void> => {
  const input = extractInput(snapshot);
  if (input) {
    return updateDocumentOutputField(snapshot, await analyzeComment(input));
  } else {
    functions.logger.log(
      "Document created without the specified input field: ",
      config.inputFieldName
    );
  }
};

const handleUpdateDocument = async (
  beforeDocSnapshot: admin.firestore.DocumentSnapshot,
  afterDocSnapshot: admin.firestore.DocumentSnapshot
): Promise<void> => {
  const inputBefore = extractInput(beforeDocSnapshot);
  const inputAfter = extractInput(afterDocSnapshot);

  if (!inputAfter && !inputBefore) {
    functions.logger.log(
      "Document does not contain the specified input field: ",
      config.inputFieldName
    );
    return;
  }

  if (inputBefore === inputAfter) {
    functions.logger.log(
      "Input field %s value unchanged. Will not call perspective API.",
      config.inputFieldName
    );
    return;
  }

  if (inputAfter) {
    await updateDocumentOutputField(
      afterDocSnapshot,
      await analyzeComment(inputAfter)
    );
  } else if (inputBefore) {
    await updateDocumentOutputField(
      afterDocSnapshot,
      admin.firestore.FieldValue.delete()
    );
  }
};

const extractInput = (snapshot: admin.firestore.DocumentSnapshot): any => {
  return snapshot.get(config.inputFieldName);
};

const analyzeComment = async (string: string): Promise<IAttributeScores> => {
  const client = new Client(config.apiKey);
  return await client.getScores(string, {
    doNotStore: config.doNotStore === "true",
    attributes: config.attributes.split(","),
  });
};

const updateDocumentOutputField = async (
  snapshot: admin.firestore.DocumentSnapshot,
  analyzeResponse: any
): Promise<void> => {
  // Wrapping in transaction to allow for automatic retries (#48)
  await admin.firestore().runTransaction((transaction) => {
    transaction.update(snapshot.ref, config.outputFieldName, analyzeResponse);
    return Promise.resolve();
  });
};
