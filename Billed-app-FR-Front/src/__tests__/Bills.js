/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom" // sert à faire fonctionner le toHaveClass
import { screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
jest.mock("../app/format.js", () => ({
    formatDate: jest.fn(),
    formatStatus: jest.fn((status) => (status === "pending" ? "En attente" : status)),
}))
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)
describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
        test("Then bill icon in vertical layout should be highlighted", async () => {
            Object.defineProperty(window, "localStorage", { value: localStorageMock })
            window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }))
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.append(root)
            router()
            window.onNavigate(ROUTES_PATH.Bills)
            await waitFor(() => screen.getByTestId("icon-window"))
            const windowIcon = screen.getByTestId("icon-window")
            //to-do write expect expression
            expect(windowIcon).toHaveClass("active-icon") // Expect demandé dans le kanban
        })
        test("Then bills should be ordered from earliest to latest", () => {
            document.body.innerHTML = BillsUI({ data: bills })
            const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML)
            const antiChrono = (a, b) => (a < b ? 1 : 1) // - du -1 enlevé, rangé dans l'ordre demandé
            const datesSorted = [...dates].sort(antiChrono)
            expect(dates).toEqual(datesSorted)
        })
    })

    ///////////////// Quand je clique sur l'icone de l'oeil la modal s'affiche////////
    describe("When I click on a eye icon", () => {
        test("Then a modal should be displayed", () => {
            Object.defineProperty(window, localStorage, {
                value: localStorageMock,
            })
            window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }))

            document.body.innerHTML = BillsUI({ data: bills })
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname })
            }

            const bill = new Bills({
                document,
                onNavigate,
                localStorage: localStorageMock,
                store: null,
            })

            $.fn.modal = jest.fn()

            const handleClickIconEye = jest.fn(() => {
                bill.handleClickIconEye
            })
            const eyeIcons = screen.getAllByTestId("icon-eye")

            for (let eyeIcon of eyeIcons) {
                handleClickIconEye(eyeIcon)
                userEvent.click(eyeIcon)
            }

            expect(handleClickIconEye).toHaveBeenCalledTimes(eyeIcons.length)
            expect($.fn.modal).toHaveBeenCalled()
        })
    })

    ///////////// Ajout des erreurs 404 et 500 du test d'integration GET de Dashboard ///////////
    describe("When an error occurs on API", () => {
        beforeEach(() => {
            jest.spyOn(mockStore, "bills")
            Object.defineProperty(window, "localStorage", { value: localStorageMock })
            window.localStorage.setItem(
                "user",
                JSON.stringify({
                    type: "Employee",
                    email: "a@a",
                })
            )
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.appendChild(root)
            router()
        })
        test("fetches bills from an API and fails with 404 message error", async () => {
            mockStore.bills.mockImplementationOnce(() => {
                return {
                    list: () => {
                        return Promise.reject(new Error("Erreur 404"))
                    },
                }
            })
            window.onNavigate(ROUTES_PATH.Bills)
            await new Promise(process.nextTick)
            const message = await screen.getByText(/Erreur 404/)
            expect(message).toBeTruthy()
        })

        test("fetches messages from an API and fails with 500 message error", async () => {
            mockStore.bills.mockImplementationOnce(() => {
                return {
                    list: () => {
                        return Promise.reject(new Error("Erreur 500"))
                    },
                }
            })

            window.onNavigate(ROUTES_PATH.Bills)
            await new Promise(process.nextTick)
            const message = await screen.getByText(/Erreur 500/)
            expect(message).toBeTruthy()
        })
    })
})

// describe("Given I am connected as an Employee and I am on the Bills page", () => {
//     describe("When I click on a Bill", () => {
//         test("Then The Bill details is displayed", async () => {})
//     })
// })

//////////// Test qui permet que lorsque la Note de frais n'est pas daté, Gére l'erreur et retourne une date non entrée ////////
describe("Given I have a bill with a corrupted date", () => {
    test("Then it should handle the error and return the bill with unformatted date", async () => {
        const { formatDate } = require("../app/format.js")
        formatDate.mockImplementation(() => {
            throw new Error("Corrupted date")
        })

        const mockStore = {
            bills: jest.fn().mockReturnValue({
                list: jest.fn().mockResolvedValue([
                    {
                        id: "1",
                        date: "Not a date", // Date corrompue
                        status: "pending",
                    },
                ]),
            }),
        }
        const bills = new Bills({
            document,
            onNavigate,
            store: mockStore,
            localStorage,
        })

        const billsList = await bills.getBills()

        expect(billsList).toEqual([
            {
                id: "1",
                date: "Not a date", // Doit garder la date corrompue
                status: "En attente",
            },
        ])

        // A la fin du test, reinitialise l'implementation du mock à son comportement par defaut
        formatDate.mockImplementation(() => {})
    })
})

describe("Given I am a user connected as Admin", () => {
    describe("When an error occurs on API", () => {
        beforeEach(() => {
            jest.spyOn(mockStore, "bills")
            Object.defineProperty(window, "localStorage", { value: localStorageMock })
            window.localStorage.setItem(
                "user",
                JSON.stringify({
                    type: "Admin",
                    email: "a@a",
                })
            )
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.appendChild(root)
            router()
        })
        test("fetches bills from an API and fails with 404 message error", async () => {
            mockStore.bills.mockImplementationOnce(() => {
                return {
                    list: () => {
                        return Promise.reject(new Error("Erreur 404"))
                    },
                }
            })
            window.onNavigate(ROUTES_PATH.Dashboard)
            await new Promise(process.nextTick)
            const message = await screen.getByText(/Erreur 404/)
            expect(message).toBeTruthy()
        })

        test("fetches messages from an API and fails with 500 message error", async () => {
            mockStore.bills.mockImplementationOnce(() => {
                return {
                    list: () => {
                        return Promise.reject(new Error("Erreur 500"))
                    },
                }
            })

            window.onNavigate(ROUTES_PATH.Dashboard)
            await new Promise(process.nextTick)
            const message = await screen.getByText(/Erreur 500/)
            expect(message).toBeTruthy()
        })
    })
})
