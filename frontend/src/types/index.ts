export type User = {
  id: string;
  name: string;
  email: string;
};

export type Trip = {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  tripCode: string;
  invitedEmails: string[];
  members?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
};

export type Activity = {
  _id: string;
  time: string;
  activityName: string;
  location: string;
  estimatedCost: number;
  position: number;
};

export type ItineraryDay = {
  _id: string;
  trip: string;
  dayNumber: number;
  activities: Activity[];
};

export type Expense = {
  _id: string;
  description: string;
  amount: number;
  paidBy: {
    _id: string;
    name: string;
    email: string;
  };
  shares: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    amount: number;
  }>;
};

export type Settlement = {
  fromUserId?: string;
  toUserId?: string;
  from: string;
  to: string;
  amount: number;
};

export type SettledRecord = {
  _id: string;
  fromUser: {
    _id: string;
    name: string;
    email: string;
  };
  toUser: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  settledAt: string;
};
