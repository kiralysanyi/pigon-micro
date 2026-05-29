const formatMsgDate = (date: Date): string => {
    const now = new Date();
    const sameDay = date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    if (sameDay) return time;

    const day = date.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
    return `${day} ${time}`;
};

export default formatMsgDate;