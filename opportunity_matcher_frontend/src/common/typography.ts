/**
 * Fixed rem type scale - one size per role, no viewport clamp.
 * Weights used: 400, 500, 600, 700 (all loaded via Google Fonts).
 */
const typography = {
  pageTitle: { fontSize: "1.5rem", fontWeight: 700 },
  pageTitleSmall: { fontSize: "0.875rem", fontWeight: 500 },
  pageSubTitle: { fontSize: "1rem", fontWeight: 600 },
  kpiValue: { fontSize: "1.75rem", fontWeight: 700 },
  kpiTitle: { fontSize: "0.8125rem", fontWeight: 600 },
  kpiSubTitle: { fontSize: "0.75rem", fontWeight: 500 },
  button: { fontSize: "0.875rem", fontWeight: 500, padding: "0.4rem 1rem" },
  datasHeading: { fontSize: "1rem", fontWeight: 600 },
  datasSubHeading: { fontSize: "0.75rem", fontWeight: 500 },
  dataRoundedValue: {
    fontSize: "0.875rem",
    fontWeight: 700,
    padding: "0.5rem 1rem",
  },
  paragraph: { fontSize: "0.875rem", fontWeight: 500 },
  Label: { fontSize: "0.8125rem", fontWeight: 500 },
  Value: { fontSize: "0.875rem", fontWeight: 500 },
  paginationButtons: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
  },
  paginateRecords: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
  },
  filterLabel: { fontSize: "0.8125rem", fontWeight: 500 },
  SliderNumValue: { fontSize: "0.8125rem", fontWeight: 600 },
  selectBox: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    padding: "0.7rem 0.8rem",
  },
  selectBoxOptions: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    padding: "0.5rem 0.8rem",
  },
  smallTitle: { fontSize: "0.9375rem", fontWeight: 600 },
  overAllPercentage: { fontSize: "1.25rem", fontWeight: 700 },
  sectorPercentage: { fontSize: "0.875rem", fontWeight: 600 },
  tableHeader: {
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.5rem 1rem",
  },
  tableDatas: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
  },
};

export default typography;
