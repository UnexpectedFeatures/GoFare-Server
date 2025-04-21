import db from "../../database.js";
import admin from "firebase-admin";
import { eventLogger } from "../../Services/logger.js";

const PH_HOLIDAYS = {
  NEW_YEAR: {
    name: "New Year Sale",
    month: 1,
    date: 1,
    discountPercentage: 15,
  },
  VALENTINES: {
    name: "Valentine's Day Sale",
    month: 2,
    date: 14,
    discountPercentage: 10,
  },
  HOLY_WEEK: {
    name: "Holy Week Sale",
    month: 4,
    date: [7, 8, 9],
    discountPercentage: 10,
    variableDate: true,
  },
  LABOR_DAY: {
    name: "Labor Day Sale",
    month: 5,
    date: 1,
    discountPercentage: 10,
  },
  INDEPENDENCE: {
    name: "Independence Day Sale",
    month: 6,
    date: 12,
    discountPercentage: 10,
  },
  CHRISTMAS: {
    name: "Christmas Sale",
    month: 12,
    date: 25,
    discountPercentage: 15,
  },
  RIZAL_DAY: {
    name: "Rizal Day Sale",
    month: 12,
    date: 30,
    discountPercentage: 10,
  },
};

function getHolyWeekDates(year) {
  return (
    {
      2023: [7, 8, 9],
      2024: [29, 30, 31],
      2025: [18, 19, 20],
    }[year] || [7, 8, 9]
  );
}

export async function handleDiscountsCounter() {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDate = today.getDate();

    let activeHoliday = null;

    for (const [holidayKey, holidayConfig] of Object.entries(PH_HOLIDAYS)) {
      if (holidayConfig.variableDate) {
        if (holidayKey === "HOLY_WEEK") {
          const holyWeekDates = getHolyWeekDates(currentYear);
          if (
            currentMonth === holidayConfig.month &&
            holyWeekDates.includes(currentDate)
          ) {
            activeHoliday = holidayConfig;
            break;
          }
        }
      } else if (
        currentMonth === holidayConfig.month &&
        currentDate === holidayConfig.date
      ) {
        activeHoliday = holidayConfig;
        break;
      }
    }

    if (activeHoliday) {
      const eventId = `${activeHoliday.name.replace(
        /\s+/g,
        "_"
      )}_${currentYear}`;
      const eventRef = db.collection("Events").doc(eventId);

      const eventData = {
        name: activeHoliday.name,
        discountPercentage: activeHoliday.discountPercentage,
        activationDate: admin.firestore.Timestamp.fromDate(today),
        active: true,
        country: "Philippines",
        holidayType: "Regular Holiday",
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      };

      await eventRef.set(eventData, { merge: true });

      eventLogger.info(
        `${activeHoliday.name} activated: ${activeHoliday.discountPercentage}% discount`
      );

      return {
        status: "activated",
        event: eventId,
        discountPercentage: activeHoliday.discountPercentage,
        date: today.toISOString(),
        holidayData: activeHoliday,
      };
    } else {
      const eventsRef = db.collection("Events");
      const snapshot = await eventsRef.get();

      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        eventLogger.info("All events deleted as no holiday is active today");
      }

      eventLogger.info("No Philippine holiday discount applicable today");
      return {
        status: "inactive",
        date: today.toISOString(),
        country: "Philippines",
        eventsDeleted: !snapshot.empty,
      };
    }
  } catch (error) {
    eventLogger.error("Failed to process holiday discounts:", error);
    throw new Error(`Philippine holiday processing failed: ${error.message}`);
  }
}

function startHolidayCheckInterval() {
  eventLogger.info(
    "Starting Philippine holiday discount monitoring service..."
  );

  handleDiscountsCounter().catch((error) =>
    eventLogger.error("Initial holiday check failed:", error)
  );

  const interval = setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 1) {
      try {
        eventLogger.info("Daily Philippine holiday check running...");
        const result = await handleDiscountsCounter();
        eventLogger.info(
          "Holiday check completed:",
          JSON.stringify(result, null, 2)
        );
      } catch (error) {
        eventLogger.error("Holiday check error:", error);
      }
    }
  }, 60000);

  return interval;
}

const holidayInterval = startHolidayCheckInterval();

process.on("SIGTERM", () => {
  clearInterval(holidayInterval);
  eventLogger.info("Philippine holiday service stopped");
});

process.on("SIGINT", () => {
  clearInterval(holidayInterval);
  eventLogger.info("Philippine holiday service stopped");
});
