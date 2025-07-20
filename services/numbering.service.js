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

export const revertNumber = async (counterName, numberToRevert, transaction) => {
  const counter = await db.Counter.findOne({
    where: { name: counterName },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (counter && counter.value === numberToRevert) {
    counter.value -= 1;
    await counter.save({ transaction });
    return true;
  }
  // If the number to revert is not the current highest, we don't revert automatically
  // This prevents issues if numbers are deleted out of order.
  return false;
};

export const setCounterNumber = async (counterName, newNumber, transaction) => {
  const [counter, created] = await db.Counter.findOrCreate({
    where: { name: counterName },
    defaults: { value: newNumber },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!created) {
    counter.value = newNumber;
    await counter.save({ transaction });
  }
  return counter.value;
};
