export function calculateDriverReputation(input = {}) {
  const punctuality = Number(input.punctuality ?? 80);
  const communication = Number(input.communication ?? 80);
  const cleanliness = Number(input.cleanliness ?? 80);
  const comfort = Number(input.comfort ?? 80);
  const cancellationDiscipline = Number(input.cancellation_discipline ?? 80);
  const weights = {
    punctuality: 0.3,
    communication: 0.15,
    cleanliness: 0.15,
    comfort: 0.2,
    cancellationDiscipline: 0.2,
  };
  const score =
    punctuality * weights.punctuality +
    communication * weights.communication +
    cleanliness * weights.cleanliness +
    comfort * weights.comfort +
    cancellationDiscipline * weights.cancellationDiscipline;
  return {
    score: Math.round(score),
    punctuality,
    communication,
    cleanliness,
    comfort,
    cancellation_discipline: cancellationDiscipline,
  };
}
