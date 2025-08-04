import {
  peekFares,
  offPeekFares,
  dailyCapLimits,
  weeklyCapLimits,
  peekHours,
} from "./rules/FareDetails";

import GroupingHelper from "./GroupingHelper";

/**
 * Jouney type for input object
 **/
interface Journey {
  dateTime: Date;
  from: number;
  to: number;
}

/**
 * Fare type for output daily and weekly fares
 **/
interface Fare {
  dateOrWeek: string;
  fare: number;
  maxZone: Array<number>;
}

/**
 * Output fares of output
 **/
interface OutputFares {
  singleFares: Fare[];
  weekFares: Fare[];
}

/**
 * A class for Fare calculation and the required methods
 **/
class FareCalculation {
  // class variables to use across functions
  totalDailyFare: number = 0;
  maxDailyCap: number = 0;
  maxZone: Array<number> = [1, 1];

  /**
   * Calculates the journey fare for each day
   *
   * @param {object} inputJourneyData Input file data to process.
   * @returns {Fare[]} Fare calculated for all the days in the input
   */
  calculateFares = (inputJourneyData: object): OutputFares => {
    const listJourney: Journey[] = Object.values(inputJourneyData).map(
      (j: Journey) => {
        return { ...j, dateTime: new Date(j.dateTime) }; // Casting to Date field
      }
    );

    const groupingHelper = new GroupingHelper();

    // Grouping by day to calculate each day fare and apply limit
    const journeyByDate: Map<string, Journey[]> =
      groupingHelper.groupJourneyByDate(listJourney);

    let singleTripFares = new Array<Fare>();
    for (let [, singleDayTrips] of journeyByDate) {
      singleTripFares.push(...this.findEachTripFare(singleDayTrips));
    }

    let dailyFares = new Array<Fare>();
    for (const [dateKey, journeyItem] of journeyByDate) {
      this.totalDailyFare = 0;
      this.maxDailyCap = 0;
      this.maxZone = [2, 2];
      for (const ji of journeyItem) {
        this.findDayTripFare(ji);
      }
      dailyFares.push({
        dateOrWeek: dateKey,
        fare: this.totalDailyFare,
        maxZone: this.maxZone,
      });
    }

    // Grouping by week to calculate each week fare and apply limit
    const journeyByWeek: Map<string, Fare[]> =
      groupingHelper.groupJourneyByWeek(dailyFares);

    let weeklyFares = new Array<Fare>();
    for (let [, weekJourney] of journeyByWeek) {
      this.findWeekTripFare(weekJourney);
      weeklyFares.push(...weekJourney);
    }

    return { singleFares: singleTripFares, weekFares: weeklyFares };
  };

  /**
   * Calculate fares for a day
   *
   * @param {Journey} singleJourney Journey data aggregated for a day
   */
  findDayTripFare = (singleJourney: Journey) => {
    this.totalDailyFare += this._calculateSingleTripFare(singleJourney);

    if (
      this.maxDailyCap < dailyCapLimits[singleJourney.from][singleJourney.to]
    ) {
      this.maxDailyCap = dailyCapLimits[singleJourney.from][singleJourney.to];
      this.maxZone = [singleJourney.from, singleJourney.to];
    }

    this.totalDailyFare = Math.min(this.maxDailyCap, this.totalDailyFare);
  };

  /**
   * Calculate daily fare and limit it to 0 if the weekly cap is reached based on zone
   *
   * @param {Fare[]} weekJourney Journey data aggregated for a week
   */
  findWeekTripFare = (weekJourney: Fare[]) => {
    // Find the max cap limit zone travelled in the week
    let maxZone = [2, 2];
    for (const wj of weekJourney) {
      if (wj.maxZone[0] !== wj.maxZone[1]) {
        maxZone = [wj.maxZone[0], wj.maxZone[1]];
      } else if (wj.maxZone[0] == 1) {
        maxZone = [wj.maxZone[0], wj.maxZone[1]];
      }
    }
    const maxWeeklyCap = weeklyCapLimits[maxZone[0]][maxZone[1]];
    let weekTotal: number = 0,
      weekCapReached: boolean = false;
    for (const wj of weekJourney) {
      if (maxWeeklyCap < weekTotal + wj.fare) {
        wj.fare = maxWeeklyCap - weekTotal;
        weekCapReached = true;
      } else if (maxWeeklyCap == weekTotal + wj.fare) {
        wj.fare = 0;
        weekCapReached = true;
      } else if (weekCapReached) {
        wj.fare = 0;
      }
      weekTotal += wj.fare;
    }
  };

  /**
   * Calculate each trip fare and limit it to 0 if the daily cap is reached or
   * the weekly cap is reached based on zone
   *
   * @param {Journey[]} singleDayTrips Single day trips aggregated by date
   * @returns {Fare[]} singleDayFares Fares calculated for each trip
   */
  findEachTripFare = (singleDayTrips: Journey[]): Fare[] => {
    let maxZone = [2, 2];
    // Find the max cap limit zone travelled in the week
    for (const sj of singleDayTrips) {
      if (sj.from !== sj.to) {
        this.maxZone = [sj.from, sj.to];
      } else if (sj.from == 1) {
        this.maxZone = [sj.from, sj.to];
      }
    }
    const maxWeeklyCap = weeklyCapLimits[maxZone[0]][maxZone[1]];
    const maxDailyCap = dailyCapLimits[maxZone[0]][maxZone[1]];
    let dayTotal: number = 0,
      dayCapReached: boolean = false;
    let singleTripFares = new Array<Fare>();
    for (const sj of singleDayTrips) {
      let sjFare = this._calculateSingleTripFare(sj);
      if (maxDailyCap < dayTotal + sjFare) {
        sjFare = maxDailyCap - dayTotal;
        dayCapReached = true;
      } else if (maxDailyCap == dayTotal + sjFare) {
        sjFare = 0;
        dayCapReached = true;
      } else if (dayCapReached) {
        sjFare = 0;
      }
      singleTripFares.push({
        dateOrWeek:
          sj.dateTime.toDateString() + " " + sj.dateTime.toLocaleTimeString(),
        fare: sjFare,
        maxZone: maxZone,
      });
      dayTotal += sjFare;
    }

    return singleTripFares;
  };

  /**
   * Calculate each trip fare based on peek-offpeek hour and weekday-weekend
   *
   * @param {Journey} singleJourney Journey data aggregated for a day
   * @returns number Fare value
   */
  _calculateSingleTripFare(singleJourney: Journey): number {
    return this._isPeekHour(singleJourney.dateTime)
      ? peekFares[singleJourney.from][singleJourney.to]
      : offPeekFares[singleJourney.from][singleJourney.to];
  }

  /**
   * Determines if time is peek hour for weekday and weekend
   * @param {Date | String} dateTime Date to get hours
   * @returns {boolean} Peek hour or not
   */
  _isPeekHour = (dateTime: Date): boolean => {
    const hours = this._getHours(dateTime);
    const dayOrEnd = this._isWeekend(dateTime) ? "weekend" : "weekday";
    return (
      (this._getHours(peekHours[dayOrEnd].mStart) <= hours &&
        this._getHours(peekHours[dayOrEnd].mEnd) >= hours) ||
      (this._getHours(peekHours[dayOrEnd].eStart) <= hours &&
        this._getHours(peekHours[dayOrEnd].eEnd) >= hours)
    );
  };

  /**
   * Calculates the hours for the time
   * @param {Date | String} peekTime Date to get hours
   * @returns {number} Calculated hours
   */
  _getHours = (peekTime: Date | string): number => {
    if (peekTime instanceof Date) {
      var [hours, minutes, seconds] = [
        peekTime.getHours(),
        peekTime.getMinutes(),
        peekTime.getSeconds(),
      ];
    } else {
      [hours, minutes, seconds] = peekTime.split(":").map((e) => Number(e));
    }
    return hours * 3_600_000 + minutes * 60_000 + seconds * 1_000;
  };

  /**
   * Determines if the date is weekend or weekday
   *
   * @param {Date} dateTime Date to find
   * @returns {boolean} True if weekend
   */
  _isWeekend = (dateTime: Date): boolean => {
    return dateTime.getDay() == 0 || dateTime.getDay() == 6;
  };
}

export default FareCalculation;
