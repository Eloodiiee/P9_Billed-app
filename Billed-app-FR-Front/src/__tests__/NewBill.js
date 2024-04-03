/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { screen, fireEvent } from "@testing-library/dom"
import { ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import "@testing-library/jest-dom"

jest.mock("../app/store", () => mockStore)

///////////// Ce cas de test verifie que les utilisateurs employés peuvent envoyer une nouvelle Note de Frais /////////

describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page", () => {
        test("Then complete form for newBill", async () => {
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname })
            }
            Object.defineProperty(window, "localStorage", {
                value: localStorageMock,
            })
            window.localStorage.setItem(
                "user",
                JSON.stringify({
                    type: "Employee",
                })
            )
            const html = NewBillUI()
            document.body.innerHTML = html
            const newBillTest = new NewBill({
                document,
                onNavigate,
                store: null,
                localStorage: window.localStorage,
            })

            const NewBillForm = screen.getByTestId("form-new-bill")
            expect(NewBillForm).toBeTruthy()

            const handleSubmit = jest.fn((e) => newBillTest.handleSubmit(e))
            NewBillForm.addEventListener("submit", handleSubmit)
            fireEvent.submit(NewBillForm)
            expect(handleSubmit).toHaveBeenCalled()
        })
    })
})
