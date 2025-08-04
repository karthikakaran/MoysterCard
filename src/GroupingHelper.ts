/**
 * A class for grouping objects by date, week and so on
 **/
class GroupingHelper {
  /**
   * Groups journey list by date
   *
   * @param {T[]} items A generic array of objects with date field, here Journey array is passed
   * @returns {Map<string, T[]>} Map with date and grouped object entries
   */
  groupJourneyByDate<T extends { dateTime: string | Date }>(
    items: T[]
  ): Map<string, T[]> {
    const groupedJourneys = new Map<string, T[]>();

    for (const item of items) {
      let dateKey: string = new Date(item.dateTime).toDateString();
      if (!groupedJourneys.has(dateKey)) {
        groupedJourneys.set(dateKey, []);
      }

      groupedJourneys.get(dateKey)!.push(item);
    }

    return groupedJourneys;
  }

  /**
   * Groups calculated daily fare list by week
   *
   * @param {T[]} items A generic array of objects with date field, here Fares array is passed
   * @returns {Map<string, T[]>} Map with date and grouped object entries
   */
  groupJourneyByWeek<T extends { dateOrWeek: Date | string }>(
    items: T[]
  ): Map<string, T[]> {
    const groupedItems = new Map<string, T[]>();

    for (const item of items) {
      const dt: Date = new Date(item.dateOrWeek);
      const year = dt.getFullYear();
      const week = this._getContinuousISOWeek(dt);

      //Format : "Week32"
      const weekKey = `Week${String(week).padStart(2, "0")}`;

      if (!groupedItems.has(weekKey)) {
        groupedItems.set(weekKey, []);
      }

      groupedItems.get(weekKey)!.push(item);
    }

    return groupedItems;
  }

  /**
   * Determines the week number
   *
   * @param {Date} date date to find the week it belongs to
   * @returns {number} Week number
   */
  _getContinuousISOWeek = (date: Date): number => {
    const tempDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = tempDate.getUTCDay() || 7;

    tempDate.setUTCDate(tempDate.getUTCDate() - dayNum + 1);

    const epochMonday = new Date(Date.UTC(1969, 11, 29));
    const msInAWeek = 1000 * 60 * 60 * 24 * 7;

    const continuousWeekNo =
      Math.floor((tempDate.getTime() - epochMonday.getTime()) / msInAWeek) + 1;

    return continuousWeekNo;
  };
}

export default GroupingHelper;
