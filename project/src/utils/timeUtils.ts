import { format } from 'date-fns';

export const formatDuration = (startTime: Date, endTime: Date = new Date()): string => {
  const diff = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const formatTimeRange = (startTime: Date, endTime: Date): string => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

export const isWithinRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  const timestamp = date.getTime();
  return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
};