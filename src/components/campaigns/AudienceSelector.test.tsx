import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AudienceSelector from './AudienceSelector';
import { apolloService } from '@/services/apollo';
import { creditsService } from '../../services/trial';

jest.mock('@/services/apollo');
jest.mock('../../services/trial');

describe('AudienceSelector', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly and loads preview leads', async () => {
    (apolloService.searchContacts as jest.Mock).mockResolvedValueOnce([{ id: 1, email: 'test@example.com' }]);
    (creditsService.getUserLimits as jest.Mock).mockResolvedValueOnce({ emailLimits: 100, smsLimits: 100 });
    render(<AudienceSelector onSelect={mockOnSelect} />);

    expect(screen.getByText(/Loading preview leads/i)).toBeInTheDocument();

    await waitFor(() => expect(mockOnSelect).toHaveBeenCalledWith(1, [{ id: 1, email: 'test@example.com' }]));
  });

  test('handles CSV upload', async () => {
    render(<AudienceSelector onSelect={mockOnSelect} />);
    const file = new File(['firstName,lastName,email\nJohn,Doe,john@example.com'], 'contacts.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/upload csv/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(mockOnSelect).toHaveBeenCalledWith(1, [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }]));
  });

  test('displays error message on invalid email', async () => {
    render(<AudienceSelector onSelect={mockOnSelect} />);
    const file = new File(['firstName,lastName,email\nJohn,Doe,invalid-email'], 'contacts.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/upload csv/i);

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });
}); 