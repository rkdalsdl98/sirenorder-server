export interface IRepository<T, S extends unknown> {
    getMany?() : Promise<T[]>
    getBy?(args: unknown) : Promise<T | S>
    create?(args: unknown) : Promise<T>
    updateBy?(updateData: unknown, args: unknown) : Promise<T>
    deleteBy?(args: unknown) : Promise<boolean>
}