/** A fetch that worked. Inside the iPad app, files bundled with it come back with status 0 and `ok` false, with the body intact. */
export const served = (r: Response): boolean => r.ok || r.status === 0
