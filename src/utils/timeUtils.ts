export const getTimeSinceUpdate = (lasttime: string, currentTime: number = Date.now()): number => {
    if (!lasttime) return 0;

    const currentTimeSeconds = Math.floor(currentTime / 1000) - 10800;

    const [datePart, timePart] = lasttime.split(' ');
    const [day, month, year] = datePart.split('.').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    const date = new Date(year, month - 1, day, hours, minutes, seconds);

    const lastTimeSeconds = Math.floor(date.getTime() / 1000);

    if (isNaN(lastTimeSeconds)) {
        return 0;
    }

    return Math.max(0, currentTimeSeconds - lastTimeSeconds);
};
