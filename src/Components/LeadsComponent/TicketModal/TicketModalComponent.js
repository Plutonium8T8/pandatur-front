import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaUser, FaTrash } from 'react-icons/fa';
import './TicketModalComponent.css';
import Priority from '../../PriorityComponent/PriorityComponent';
import Workflow from '../../WorkFlowComponent/WorkflowComponent';
import TagInput from '../../TagsComponent/TagComponent';
import { useUser } from '../../../UserContext';
import Cookies from 'js-cookie';
import { translations } from "../../utils/translations";

const parseTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.filter((tag) => tag.trim() !== '');
  }
  if (typeof tags === 'string' && tags.startsWith('{') && tags.endsWith('}')) {
    return tags
      .slice(1, -1)
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '');
  }
  return [];
};

const TicketModal = ({ ticket, onClose, onSave }) => {
  const modalRef = useRef(null);
  const { userId } = useUser();

  const language = localStorage.getItem('language') || 'RO';

  useEffect(() => {
    const fetchTicketData = async () => {
      if (ticket?.client_id) {
        try {
          const token = Cookies.get('jwt');
          const response = await fetch(`https://pandatur-api.com/tickets/${ticket.client_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Failed to load ticket data');

          const result = await response.json();
          setEditedTicket({
            ...result,
            tags: parseTags(result.tags), // Parse tags if necessary
          });
        } catch (error) {
          console.error('Error fetching ticket data:', error);
        }
      } else {
        setEditedTicket({
          ...ticket,
          tags: [],
        });
      }
    };

    fetchTicketData();
  }, [ticket]);

  const [editedTicket, setEditedTicket] = useState({
    ...ticket,
    tags: useMemo(() => parseTags(ticket?.tags), [ticket?.tags]),
  });

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedTicket((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagsChange = (updatedTags) => {
    setEditedTicket((prev) => ({
      ...prev,
      tags: updatedTags,
    }));
  };

  const handleSave = async () => {
    const ticketData = {
      ...editedTicket,
      client_id: editedTicket.client_id || userId,
      technician_id: userId,
    };

    try {
      const token = Cookies.get('jwt');
      const method = editedTicket?.client_id ? 'PATCH' : 'POST';
      const url = `https://pandatur-api.com/tickets/${editedTicket?.client_id || ''}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) throw new Error('Failed to save ticket');

      const result = await response.json();
      if (onSave) onSave(result);
      onClose();
    } catch (error) {
      console.error('Error saving ticket:', error);
    }
  };

  if (!editedTicket) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>
            <FaUser /> {translations['Lead nou'][language]}
          </h2>
        </header>
        <div className="ticket-modal-form">
          <div className="input-group">
            <label>{translations['Contact'][language]}:</label>
            <input
              type="text"
              name="name"
              value={editedTicket.contact}
              onChange={handleInputChange}
              placeholder={translations['Contact'][language]}
            />
          </div>
          <TagInput
            initialTags={editedTicket.tags}
            onChange={handleTagsChange}
          />
          <div className="input-group">
            <label>{translations['Descriere'][language]}:</label>
            <textarea
              name="description"
              value={editedTicket.description}
              onChange={handleInputChange}
              placeholder={translations['Adaugă descriere lead'][language]}
            />
          </div>
          <div className="container-select-priority-workflow">
            <Priority ticket={editedTicket} onChange={handleInputChange} />
            <Workflow ticket={editedTicket} onChange={handleInputChange} />
          </div>
          <div className="button-container">
            {ticket?.id && (
              <button
                className="clear-button"
                onClick={() => onSave(null)}
              >
                <FaTrash /> {translations['Șterge'][language]}
              </button>
            )}
            <button
              className="submit-button"
              onClick={handleSave}
            >
              {ticket?.id ? translations['Salvează'][language] : translations['Creează'][language]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
