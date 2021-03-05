/*
 * Copyright 2021 Google LLC
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

const client = new Client(config.apiKey);
const logger = functions.logger;

// Initialize the Firebase Admin SDK
admin.initializeApp();

export const fsAnalyzeCommentsOnCreate = functions.handler.firestore.document.onCreate(
  async (change): Promise<void> => {
    if (config.inputFieldName === config.outputFieldName) {
      logger.log("Input field name must not equal output field name.");
      return;
    }
    try {
      await handleCreateDocument(change);
    } catch (err) {
      logger.error(err);
    }
  }
);

export const fsAnalyzeCommentsOnUpdate = functions.handler.firestore.document.onUpdate(
  async (change): Promise<void> => {
    if (config.inputFieldName === config.outputFieldName) {
      logger.log("Input field name must not equal output field name.");
      return;
    }
    try {
      await handleUpdateDocument(change.before, change.after);
    } catch (err) {
      logger.error(err);
    }
  }
);

const handleCreateDocument = async (
  snapshot: admin.firestore.DocumentSnapshot
): Promise<void> => {
  const input = extractInput(snapshot);
  if (!input) {
    return;
  }
  return updateDocumentOutputField(snapshot, await analyzeComment(input));
};

const handleUpdateDocument = async (
  beforeDocSnapshot: admin.firestore.DocumentSnapshot,
  afterDocSnapshot: admin.firestore.DocumentSnapshot
): Promise<void> => {
  const inputBefore = extractInput(beforeDocSnapshot);
  const inputAfter = extractInput(afterDocSnapshot);

  if ((!inputAfter && !inputBefore) || inputBefore === inputAfter) {
    return;
  }

  if (inputAfter) {
    await updateDocumentOutputField(
      afterDocSnapshot,
      await analyzeComment(inputAfter)
    );
  } else if (inputBefore) {
    // Input field was deleted. Delete the remaining output field.
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
  logger.log(
    `Analyzing field '${config.inputFieldName}' for ${config.attributes}`
  );
  try {
    return await client.getScores(string, {
      doNotStore: config.doNotStore === "true",
      attributes: config.attributes.split(","),
    });
  } catch (e) {
    // Something failed with the request. We raise a generic error message
    // because the perspectiveapi-js-client does not surface the API error text.
    return Promise.reject(
      "Error with the Perspective API. Please ensure your configuration and " +
        "request are valid and you have sufficient quota."
    );
  }
};

const updateDocumentOutputField = async (
  snapshot: admin.firestore.DocumentSnapshot,
  value: IAttributeScores | FirebaseFirestore.FieldValue
): Promise<void> => {
  // Wrapping in transaction to allow for automatic retries (#48)
  await admin.firestore().runTransaction((transaction) => {
    transaction.update(snapshot.ref, config.outputFieldName, value);
    return Promise.resolve();
  });
};
