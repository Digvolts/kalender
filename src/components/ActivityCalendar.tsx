import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Modal from './Modal';
import { getActivitiesForDate, addActivity, Activity } from '../services/activityService';
import { useAuth } from '../context/AuthContext';
import './ActivityCalendar.css';

interface ActivityCalendarProps {
  userId: string;
}

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ userId }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activityDates, setActivityDates] = useState<string[]>([]);
  const [newActivity, setNewActivity] = useState<Omit<Activity, 'id'>>({
    title: '',
    description: '',
    date: new Date(),
    userId: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    // Fetch all dates with activities for the current user
    const fetchActivityDates = async () => {
      try {
        const response = await fetch(`/api/activities/dates?userId=${userId}`);
        const data = await response.json();
        setActivityDates(data.dates);
      } catch (error) {
        console.error('Error fetching activity dates:', error);
      }
    };

    fetchActivityDates();
  }, [userId]);

  const handleDateChange = async (selectedDate: Date) => {
    setDate(selectedDate);
    
    try {
      const activitiesForDate = await getActivitiesForDate(selectedDate, userId);
      setActivities(activitiesForDate);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching activities for date:', error);
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.title) return;
    
    try {
      const activityToAdd = {
        ...newActivity,
        date: date,
        userId: userId,
      };
      
      await addActivity(activityToAdd);
      
      // Refresh the activities for the selected date
      const updatedActivities = await getActivitiesForDate(date, userId);
      setActivities(updatedActivities);
      
      // Add this date to activityDates if it's not already there
      const dateString = date.toISOString().split('T')[0];
      if (!activityDates.includes(dateString)) {
        setActivityDates([...activityDates, dateString]);
      }
      
      // Reset the form
      setNewActivity({
        title: '',
        description: '',
        date: new Date(),
        userId: '',
      });
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  // Function to add dots to dates with activities
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      if (activityDates.includes(dateString)) {
        return <div className="activity-dot"></div>;
      }
    }
    return null;
  };

  return (
    <div className="activity-calendar">
      <h2>Activity Calendar</h2>
      <Calendar 
        onChange={handleDateChange} 
        value={date}
        tileContent={tileContent}
      />
      
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="activities-modal">
            <h3>Activities for {date.toLocaleDateString()}</h3>
            
            {activities.length > 0 ? (
              <div className="activities-list">
                {activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No activities for this date.</p>
            )}
            
            <div className="add-activity-form">
              <h4>Add New Activity</h4>
              <input
                type="text"
                placeholder="Activity Title"
                value={newActivity.title}
                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
              />
              <textarea
                placeholder="Activity Description"
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              />
              <button onClick={handleAddActivity}>Add Activity</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ActivityCalendar;