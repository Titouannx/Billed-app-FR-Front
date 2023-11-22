/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"

import store from "../__mocks__/store.js"
import mockStore from "../__mocks__/store"

import router from "../app/Router.js"

// import store from "../app/Store.js"
// import userEvent from "@testing-library/user-event"
jest.mock("../app/Store", () => mockStore)

//Simule fonction JQuery
$.fn.modal = jest.fn()

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    describe("When I upload a file", () => {
      beforeEach(() => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.NewBill)
      })

      test("Then the file should have the right file format", () => {
        
        const fileInput = screen.getByTestId('file')

        //récupération du champs du message d'erreur
        const errorMessageElement = screen.getByTestId('error-message')
        
        const file = new File(['mock file'], 'test.jpg', {type: 'image/jpeg'})

        const event = new Event('change', { bubbles: true })

        Object.defineProperty(fileInput, 'files', {
          value: [file]
        })
        
        fileInput.dispatchEvent(event)

        // screen.debug(screen.getByTestId('file'))

        // affiche le message d'erreur si le fichier n'est pas au bon format
        expect(errorMessageElement.textContent).toBe('')
      })

      test("Then the file shouldn't accept other file format than png/jpeg/jpg ", () => {
        
        const fileInput = screen.getByTestId('file')

        //récupération du champs du message d'erreur
        const errorMessageElement = screen.getByTestId('error-message')
        
        const file = new File(['mock file'], 'test.pdf', {type: 'application/pdf'})

        const event = new Event('change', { bubbles: true })

        Object.defineProperty(fileInput, 'files', {
          value: [file]
        })
        
        fileInput.dispatchEvent(event)
        
        // screen.debug(screen.getAllByText('Extension de fichier non valide.'))

        // affiche le message d'erreur si le fichier n'est pas au bon format
        expect(errorMessageElement.textContent).toBe('Extension de fichier non valide.')
      })

      test("Then if the bill is valid, submit should render the Bill Page", async () => {
        jest.clearAllMocks();

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })
        
        const bill = {
            name: "Facture factice",
            date: "2023-09-29",
            type: "Transports",
            amount: 350,
            pct: 10,
            vat: "50",
            fileName: "test.jpg",
            fileUrl: "https://test.jpg",
            commentary: "Test bill",
        }

        document.querySelector('input[data-testid="expense-name"]').value = bill.name
        document.querySelector('input[data-testid="datepicker"]').value = bill.date
        document.querySelector('select[data-testid="expense-type"]').value = bill.type
        document.querySelector('input[data-testid="amount"]').value = bill.amount
        document.querySelector('input[data-testid="vat"]').value = bill.vat
        document.querySelector('input[data-testid="pct"]').value = bill.pct
        document.querySelector('textarea[data-testid="commentary"]').value = bill.commentary
        newBill.fileUrl = bill.fileUrl
        newBill.fileName = bill.fileName
        

        // const btn = screen.getByTestId("btn-send-bill");
        // const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        // btn.addEventListener("submit", handleSubmit);
        // fireEvent.submit(btn);

        //get buttonNewBill
        await waitFor(()=> 
          screen.getByTestId('form-new-bill')
        )
        const form = screen.getByTestId('form-new-bill')
        //add event listener
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        form.addEventListener('click', handleSubmit)
        //fire event
        userEvent.click(form)
        expect(handleSubmit).toHaveBeenCalled()
        expect(form).toBeTruthy()

        // screen.debug(form)
        // form.addEventListener("click", handleSubmit)
        // userEvent.click(form)
        // expect(screen.getByTestId("form-new-bill")).toBeTruthy();
        expect(screen.findByText("Mes notes de frais")).toBeTruthy()
        expect(screen.findByText("Transports")).toBeTruthy()
        expect(screen.findByText("Facture factice")).toBeTruthy()
        // const windowIcon = screen.getByTestId("icon-window")
        // await expect(windowIcon.classList.contains("active-icon")).toBe(true)
      })
    })
  })

    // test d'intégration POST
    describe("Given I am connected as an employee", () => {
      describe("When I am on newBill Page and I have submit the bill", () => {
        test("Then it should create/store a new mocked bill to the API POST", async () => {
            Object.defineProperty(window, "localStorage", { value: localStorageMock })
            window.localStorage.setItem(
              "user",
              JSON.stringify({
                  type: "Employee"
              })
            )
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.append(root)
            router()
            window.onNavigate(ROUTES_PATH.NewBill)

            const dataCreated = jest.spyOn(mockStore.bills(), "create")
            const bill = {
              name: "Facture factice",
              date: "2023-09-29",
              type: "Transports",
              amount: 350,
              pct: 10,
              vat: "50",
              fileName: "test.jpg",
              fileUrl: "https://test.jpg",
              commentary: "Test bill",
            }
            const result = await mockStore.bills().create(bill)

            expect(dataCreated).toHaveBeenCalled()
            expect(result).toEqual({ fileUrl: "https://localhost:3456/images/test.jpg", key: "1234" })
        })
        describe("When an error occurs on API", () => {
            beforeEach(() => {
              jest.spyOn(mockStore, "bills")
              Object.defineProperty(window, "localStorage", { value: localStorageMock })
              window.localStorage.setItem(
                  "user",
                  JSON.stringify({
                    type: "Employee"
                  })
              )
              const root = document.createElement("div")
              root.setAttribute("id", "root")
              document.body.appendChild(root)
              router()
            })
            test("Then sends a new bill to the API and fails with 404 error message", async () => {
              const error = new Error("Erreur 404")
              mockStore.bills.mockImplementationOnce(() => {
                  return {
                    create: () => {
                        return Promise.reject(new Error("Erreur 404"))
                    },
                  }
              })

              window.onNavigate(ROUTES_PATH.NewBill)
              await new Promise(process.nextTick)
              await expect(mockStore.bills().create({})).rejects.toEqual(error)
            })

            test("Then sends a new bill to the API and fails with 500 error message", async () => {
              const error = new Error("Erreur 500")
              mockStore.bills.mockImplementationOnce(() => {
                  return {
                    create: () => {
                        return Promise.reject(new Error("Erreur 500"))
                    },
                  }
              })

              window.onNavigate(ROUTES_PATH.NewBill)
              await new Promise(process.nextTick)
              await expect(mockStore.bills().create({})).rejects.toEqual(error)
            })

        })
      })
    })
  })