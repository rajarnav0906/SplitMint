/**
 * Split Calculator Service
 * Handles calculation of expense splits for different split modes
 * with proper rounding to ensure total matches expense amount
 */

/**
 * Calculate equal splits among participants
 * @param {Number} amount - Total expense amount
 * @param {Array} participantIds - Array of participant IDs to split among
 * @returns {Array} Array of split objects with participantId and amount
 */
export const calculateEqualSplits = (amount, participantIds) => {
  if (!participantIds || participantIds.length === 0) {
    throw new Error('At least one participant is required for equal split');
  }

  const numberOfParticipants = participantIds.length;
  const baseAmount = amount / numberOfParticipants;
  
  // Round to 2 decimal places
  const roundedAmount = Math.round(baseAmount * 100) / 100;
  
  // Calculate total of rounded amounts
  let totalRounded = roundedAmount * numberOfParticipants;
  
  // Calculate difference due to rounding
  const difference = Math.round((amount - totalRounded) * 100) / 100;
  
  // Distribute splits
  const splits = participantIds.map((participantId, index) => {
    // Add the rounding difference to the first participant
    // This ensures the total always matches the original amount
    const splitAmount = index === 0 
      ? roundedAmount + difference 
      : roundedAmount;
    
    return {
      participantId,
      amount: Math.round(splitAmount * 100) / 100 // Round to 2 decimal places
    };
  });

  return splits;
};

/**
 * Calculate percentage-based splits
 * @param {Number} amount - Total expense amount
 * @param {Array} splits - Array of objects with participantId and percentage
 * @returns {Array} Array of split objects with participantId, amount, and percentage
 */
export const calculatePercentageSplits = (amount, splits) => {
  if (!splits || splits.length === 0) {
    throw new Error('At least one split is required for percentage split');
  }

  // Validate that percentages sum to 100
  const totalPercentage = splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
  
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error('Percentages must sum to 100');
  }

  // Calculate amounts based on percentages
  const calculatedSplits = splits.map((split, index) => {
    const percentageAmount = (amount * split.percentage) / 100;
    const roundedAmount = Math.round(percentageAmount * 100) / 100;
    
    return {
      participantId: split.participantId,
      amount: roundedAmount,
      percentage: split.percentage
    };
  });

  // Adjust for rounding differences
  const totalCalculated = calculatedSplits.reduce((sum, split) => sum + split.amount, 0);
  const difference = Math.round((amount - totalCalculated) * 100) / 100;
  
  // Add difference to first split to ensure total matches
  if (calculatedSplits.length > 0) {
    calculatedSplits[0].amount = Math.round((calculatedSplits[0].amount + difference) * 100) / 100;
  }

  return calculatedSplits;
};

/**
 * Validate and normalize custom splits
 * @param {Number} amount - Total expense amount
 * @param {Array} splits - Array of objects with participantId and amount
 * @returns {Array} Array of validated split objects
 */
export const validateCustomSplits = (amount, splits) => {
  if (!splits || splits.length === 0) {
    throw new Error('At least one split is required for custom split');
  }

  // Calculate total of custom amounts
  const totalCustomAmount = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
  
  // Check if total matches expense amount (with small tolerance for rounding)
  if (Math.abs(totalCustomAmount - amount) > 0.01) {
    throw new Error(`Custom split amounts (${totalCustomAmount}) must sum to expense amount (${amount})`);
  }

  // Validate no negative amounts
  const hasNegative = splits.some(split => split.amount < 0);
  if (hasNegative) {
    throw new Error('Split amounts cannot be negative');
  }

  // Round all amounts to 2 decimal places
  const normalizedSplits = splits.map(split => ({
    participantId: split.participantId,
    amount: Math.round(split.amount * 100) / 100
  }));

  // Adjust for rounding differences
  const totalNormalized = normalizedSplits.reduce((sum, split) => sum + split.amount, 0);
  const difference = Math.round((amount - totalNormalized) * 100) / 100;
  
  if (Math.abs(difference) > 0.01 && normalizedSplits.length > 0) {
    normalizedSplits[0].amount = Math.round((normalizedSplits[0].amount + difference) * 100) / 100;
  }

  return normalizedSplits;
};

/**
 * Calculate splits based on split mode
 * @param {String} splitMode - 'equal', 'custom', or 'percentage'
 * @param {Number} amount - Total expense amount
 * @param {Array} participantIds - Array of participant IDs (for equal split)
 * @param {Array} splits - Array of split objects (for custom/percentage)
 * @returns {Array} Calculated split objects
 */
export const calculateSplits = (splitMode, amount, participantIds, splits) => {
  switch (splitMode) {
    case 'equal':
      return calculateEqualSplits(amount, participantIds);
    
    case 'percentage':
      return calculatePercentageSplits(amount, splits);
    
    case 'custom':
      return validateCustomSplits(amount, splits);
    
    default:
      throw new Error(`Invalid split mode: ${splitMode}`);
  }
};
