### See it in action

Before you proceed, make sure you have followed the instructions on our [Get Started page](https://support.perspectiveapi.com/s/docs-get-started) to request API access, [enabled the API](https://support.perspectiveapi.com/s/docs-enable-the-api), and created an API key.

To test out the extension:

1.  Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/${param:PROJECT_ID}/firestore/data) in the Firebase console.

2.  If it doesn't already exist, create the collection you specified during installation: ${param:COLLECTION_PATH}.

3.  Create a document with a field named `${param:INPUT_FIELD_NAME}` and add the text that you want to analyze.

4.  In a few seconds, you'll see a new field called `${param:OUTPUT_FIELD_NAME}` pop up in the same document. The field will contain the Perspective API scores for the attributes you specified in `${param:ATTRIBUTES}`.

### Using the extension

Whenever you create a document with a `${param:INPUT_FIELD_NAME}` in `${param:COLLECTION_PATH}`, the extension:

- "Scores" the field text using the Perspective API. Perspective API predicts the perceived impact a comment may have on a conversation by evaluating that comment across a range of emotional concepts, called attributes. Learn about [key concepts](https://support.perspectiveapi.com/s/about-the-api-attributes-and-languages) and [available attributes](https://support.perspectiveapi.com/s/about-the-api-attributes-and-languages) on support.perspectiveapi.com.
- Writes the Perspective API scores for the text to the `${param:OUTPUT_FIELD_NAME}` in the same document.

```
{
  ${param:INPUT_FIELD_NAME}: 'I think that's stupid',
  ${param:OUTPUT_FIELD_NAME}: {
    IDENTITY_ATTACK: 0.18496944,
    INSULT: 0.734651,
    PROFANITY: 0.8069778,
    SEVERE_TOXICITY: 0.327704,
    THREAT: 0.10428707
    TOXICITY: 0.76860064
  },
}
```

If the ${param:INPUT_FIELD_NAME} field of the document is updated, the extension also automatically re-analyzes the text and updates the ${param:OUTPUT_FIELD_NAME} field value.

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
