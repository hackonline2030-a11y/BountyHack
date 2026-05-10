import * as React from 'react';

interface UserWelcomeMessageProps {
  userName: string;
}

export function UserWelcomeMessage({ userName }: UserWelcomeMessageProps) {
  return (
    <div>
      <h1>Welcome, {userName}!</h1>
    </div>
  );
}