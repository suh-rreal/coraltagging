import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

test('renders dashboard title', () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: /reef coral overview/i })).toBeInTheDocument();
});
