// @ts-nocheck
test('renders correctly and loads preview leads', async () => {
    (apolloService.searchContacts as jest.Mock).mockResolvedValueOnce([{ id: 1, email: 'test@example.com' }]);
    (creditsService.getUserLimits as jest.Mock).mockResolvedValueOnce({ emailLimits: 100, smsLimits: 100 });
    render(<AudienceSelector onSelect={mockOnSelect} />);
    // ... additional test logic ...
}); 