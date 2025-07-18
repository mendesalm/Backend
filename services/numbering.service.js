import db from "../models/index.js";

export const getNextNumber = async (counterName, transaction) => {
  const counter = await db.Counter.findOne({
    where: { name: counterName },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (counter) {
    counter.value += 1;
    await counter.save({ transaction });
    return counter.value;
  }

  const newCounter = await db.Counter.create(
    { name: counterName, value: 1 },
    { transaction }
  );
  return newCounter.value;
};
