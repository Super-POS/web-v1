const formatTimeDifference = (diff: moment.Duration): string => {
    if (diff.asSeconds() < 0) {
        return `0 Seconds ago`;
    } else if (diff.asSeconds() < 60) {
        return `${Math.floor(diff.asSeconds())} Seconds ago`;
    } else if (diff.asMinutes() < 60) {
        return `${Math.floor(diff.asMinutes())} Minutes ago`;
    } else if (diff.asHours() < 24) {
        return `${Math.floor(diff.asHours())} Hours ago`;
    } else if (diff.asDays() < 7) {
        return `${Math.floor(diff.asDays())} The day before`;
    } else if (diff.asDays() < 365) {
        return `${Math.floor(diff.asDays() / 7)} Last week`;
    } else {
        return `${Math.floor(diff.asYears())} Last year`;
    }
}

export default formatTimeDifference;