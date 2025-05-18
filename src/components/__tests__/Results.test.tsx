import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Results } from "../Results.tsx";
import { mockApiResponse } from "../../api/mockApiResponse.tsx";

jest.spyOn(globalThis, "fetch").mockImplementation(() =>
  Promise.resolve(
    new Response(JSON.stringify(mockApiResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  )
);

const queryClient = new QueryClient();

const Wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const userName = "some-user";
const otherUserName = "other-user";

describe("Results component", () => {
  it("should handle the `userName` prop updates correctly", async () => {
    const { rerender } = render(<Results userName={""} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      /no user data fetched yet/i
    );

    rerender(<Results userName={userName} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      new RegExp(`looking for users matching "${userName}"...`, "i")
    );

    expect(await screen.findByText(/results for:/i)).toHaveTextContent(
      new RegExp(`Results for: "${userName}"`, "i")
    );

    rerender(<Results userName={otherUserName} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      new RegExp(`looking for users matching "${otherUserName}"...`, "i")
    );

    expect(await screen.findByText(/results for:/i)).toHaveTextContent(
      new RegExp(`Results for: "${otherUserName}"`, "i")
    );
  });

  it("should display the list of users correctly", async () => {
    render(<Results userName={userName} />, {
      wrapper: Wrapper,
    });

    const listItems = await screen.findAllByRole("listitem");
    expect(listItems).toHaveLength(30);

    listItems.forEach((item, idx) => {
      expect(within(item).getByLabelText(/github username/i)).toHaveTextContent(
        mockApiResponse.items[idx].login
      );
      expect(within(item).getByLabelText(/github user id/i)).toHaveTextContent(
        mockApiResponse.items[idx].id.toString()
      );
      expect(within(item).getByRole("link")).toHaveTextContent(
        mockApiResponse.items[idx].html_url
      );
      expect(within(item).getByRole("img")).toBeDefined();
    });
  });
});
