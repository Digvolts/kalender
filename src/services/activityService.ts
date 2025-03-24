// src/services/activityService.ts

export interface Activity {
    id: string;
    title: string;
    description: string;
    date: Date;
    userId: string;
  }
  
  // Function to get activities for a specific date
  export const getActivitiesForDate = async (date: Date, userId: string): Promise<Activity[]> => {
    const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    try {
      const response = await fetch(`/api/activities?date=${dateString}&userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.activities.map((activity: any) => ({
        ...activity,
        date: new Date(activity.date)
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  };
  
  // Function to add a new activity
  export const addActivity = async (activity: Omit<Activity, 'id'>): Promise<Activity> => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...activity,
          date: activity.date.toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        ...data.activity,
        date: new Date(data.activity.date)
      };
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  };
  
  // Function to update an existing activity
  export const updateActivity = async (activity: Activity): Promise<Activity> => {
    try {
      const response = await fetch(`/api/activities/${activity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...activity,
          date: activity.date.toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        ...data.activity,
        date: new Date(data.activity.date)
      };
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  };
  
  // Function to delete an activity
  export const deleteActivity = async (activityId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  };