import { gql } from '@apollo/client';

export const FETCH_TEMPLATES = gql`
  query FetchTemplates($category: String) {
    templates(category: $category) {
      id
      name
      category
      blocks {
        id
        type
        content
      }
      isPreset
      createdAt
      updatedAt
    }
  }
`;

export const SAVE_TEMPLATE = gql`
  mutation SaveTemplate($template: TemplateInput!) {
    saveTemplate(template: $template) {
      id
      name
      category
      blocks {
        id
        type
        content
      }
      isPreset
      updatedAt
    }
  }
`;

export const SEND_TEST_EMAIL = gql`
  mutation SendTestEmail($email: String!, $templateId: ID!) {
    sendTestEmail(email: $email, templateId: $templateId) {
      success
      message
    }
  }
`;
