/**
 * Utility functions for contact management
 */

export const addNameToContacts = (contacts) => {
  if (!Array.isArray(contacts)) {
    return addNameToContact(contacts);
  }
  return contacts.map(contact => addNameToContact(contact));
};

export const addNameToContact = (contact) => {
  if (!contact) return contact;
  const firstName = contact.first_name || '';
  const lastName = contact.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return {
    ...contact,
    name: fullName || 'No Name'
  };
};
