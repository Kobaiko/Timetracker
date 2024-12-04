import React from 'react';
import { Client } from '../types';

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId?: string;
  onSelectClient: (clientId: string) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
}) => {
  // Ensure we have a valid selectedClientId
  const effectiveSelectedId = selectedClientId || clients[0]?.id || '';
  const selectedClient = clients.find(c => c.id === effectiveSelectedId);

  return (
    <div className="relative w-64">
      <select
        value={effectiveSelectedId}
        onChange={(e) => onSelectClient(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg py-2 pl-10"
      >
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
      {selectedClient && (
        <div 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
          style={{ backgroundColor: selectedClient.color }}
        />
      )}
    </div>
  );
};