import React from 'react';
import { useClientContacts } from '../hooks';
import { useApp } from '../hooks';

export const ClientContactsDebug = ({ ticketId }) => {
  const { tickets } = useApp();
  const currentTicket = tickets?.find((t) => t.id === ticketId);
  
  const {
    clientContacts,
    selectedClient,
    loading,
  } = useClientContacts(ticketId, currentTicket);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>🔍 ClientContacts Debug</h3>
      <div><strong>Ticket ID:</strong> {ticketId}</div>
      <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
      <div><strong>Current Ticket:</strong> {currentTicket ? 'Found' : 'Not found'}</div>
      {currentTicket && (
        <div><strong>Client ID:</strong> {currentTicket.client_id}</div>
      )}
      <div><strong>Client Contacts Count:</strong> {clientContacts?.length || 0}</div>
      <div><strong>Selected Client:</strong> {selectedClient?.label || 'None'}</div>
      
      {clientContacts?.length > 0 && (
        <div>
          <h4>Platforms ({clientContacts.length}):</h4>
          <ul>
            {clientContacts.map((contact, index) => (
              <li key={index}>
                <strong>{contact.label}</strong> - {contact.value}
                <br />
                Platform: {contact.payload?.platform}
                <br />
                Contact Value: {contact.payload?.contact_value}
                <br />
                Is Primary: {contact.payload?.is_primary ? 'Yes' : 'No'}
                <br />
                Phone: {contact.payload?.phone || 'N/A'}
                <br />
                Email: {contact.payload?.email || 'N/A'}
                <br />
                All Contacts: {contact.payload?.allContacts?.length || 0} contacts
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
