import Vuetify from 'vuetify'
import { createLocalVue, mount } from '@vue/test-utils'
import StatusTab from '@/components/StatusTab.vue'
import Vuex from 'vuex'

const beaglebones = [{
  equipment: "CountingPRU",
  ip_address: "10.0.0.1",
  ip_type: "Static",
  key: "BBB:10.0.0.1:COUNTINGPRU-BBB",
  last_seen: "2022-08-01 09:39:52",
  name: "COUNTINGPRU-BBB",
  role: "Primary",
  sector: "IA-09",
  state_string: "Connected"
},
{
  equipment: "Power Supply",
  ip_address: "10.0.0.2",
  ip_type: "DHCP",
  key: "BBB:10.0.0.2:POWERSUPPLY-BBB",
  last_seen: "2022-08-01 09:39:52",
  name: "POWERSUPPLY-BBB",
  role: "Primary",
  sector: "IA-01",
  state_string: "Moved - BBB:10.0.0.4:POWERSUPPLY-BBB",
  udc: ["FirstUDC"],
  ps: ["FirstPS", "SecondPS"]
},
{
  equipment: "SIMAR",
  ip_address: "10.0.0.3",
  ip_type: "Undetermined",
  key: "BBB:10.0.0.3:SIMAR-BBB",
  last_seen: "2022-08-01 09:39:52",
  name: "SIMAR-BBB",
  role: "Primary",
  sector: "IA-17",
  state_string: "Disconnected"
}];

function getRows(wrapper) {
  return wrapper.find(".container").find(".v-data-table").find(".v-data-table__wrapper").find("table").find("tbody").findAll("tr").at(0).findAll("td");
}

describe('StatusTab.vue', () => {
  const localVue = createLocalVue()
  localVue.use(Vuex);
  let vuetify
  let store

  beforeEach(() => {
    vuetify = new Vuetify()

    store = new Vuex.Store({
      state: {
        account: undefined,
        url: "ais-eng-srv-la.cnpem.br",
        loading: false,
        beaglebones: beaglebones,
      },
      mutations: {
        updateBeaglebones(state) { },
      },
    })
  })

  const mountFunction = options => {
    return mount(StatusTab, {
      localVue,
      vuetify,
      store,
      mocks: {
        $vuetify: { breakpoint: {} }
      },
      propsData: { searchText: "", psOnly: false },
      ...options
    })
  }

  it('displays non-power supply attached Beaglebones', () => {
    const wrapper = mountFunction();
    const rows = wrapper.find(".container").find(".v-data-table").find(".v-data-table__wrapper").find("table").find("tbody").findAll("tr").at(0).findAll("td");

    expect(rows.at(0).text()).toBe("10.0.0.1");
    expect(rows.at(1).text()).toBe("COUNTINGPRU-BBB");
    expect(rows.at(3).text()).toBe("Connected");
    expect(rows.at(4).text()).toBe("Primary");
  })

  it('only displays power supply attached Beaglebones when psOnly is true', () => {
    const wrapper = mountFunction({ propsData: { searchText: "", psOnly: true } });
    const rows = wrapper.find(".container").find(".v-data-table").find(".v-data-table__wrapper").find("table").find("tbody").findAll("tr").at(0).findAll("td");

    expect(rows.at(0).text()).toBe("10.0.0.2");
    expect(rows.at(1).text()).toBe("POWERSUPPLY-BBB");
    expect(rows.at(2).text().replace(/\s+/, ",")).toBe("FirstPS,SecondPS");
    expect(rows.at(3).text()).toBe("Moved - BBB:10.0.0.4:POWERSUPPLY-BBB");
    expect(rows.at(4).text()).toBe("Primary");
  })

  it('filters search results by IP', () => {
    const wrapper = mountFunction({ propsData: { searchText: "10.0.0.3", psOnly: false } });
    const rows = getRows(wrapper);

    expect(rows.at(0).text()).toBe("10.0.0.3");
  })

  it('filters search results by hostname', () => {
    const wrapper = mountFunction({ propsData: { searchText: "SIMAR", psOnly: false } });
    const rows = getRows(wrapper);

    expect(rows.at(0).text()).toBe("10.0.0.3");
  })

  it('displays "No data available" for searches with no results', () => {
    const wrapper = mountFunction({ propsData: { searchText: "10.0.0.99", psOnly: false } });
    const rows = getRows(wrapper);

    expect(rows.at(0).text()).toBe("No data available");
  })

  it('filters by connection status', async () => {
    const wrapper = mountFunction();
    const buttons = wrapper.find(".container").find(".row").find(".col").find(".row");

    expect(getRows(wrapper).at(0).text()).toBe("10.0.0.1");

    await buttons.find("[value='Connected']").trigger("click");
    await buttons.find("[value='Disconnected']").trigger("click");

    expect(getRows(wrapper).at(0).text()).toBe("10.0.0.2");

    await buttons.find("[value='Moved']").trigger("click");
    await buttons.find("[value='Disconnected']").trigger("click");

    expect(getRows(wrapper).at(0).text()).toBe("10.0.0.3");
  })

  it('filters by IP type', async () => {
    const wrapper = mountFunction();
    const buttons = wrapper.find(".container").find(".row").find(".col").find(".row");

    expect(getRows(wrapper).at(0).text()).toBe("10.0.0.1");

    await buttons.find("[value='Static']").trigger("click");
    await buttons.find("[value='Undetermined']").trigger("click");

    expect(getRows(wrapper).at(0).text()).toBe("10.0.0.2");

    await buttons.find("[value='DHCP']").trigger("click");
    await buttons.find("[value='Undetermined']").trigger("click");

    expect(getRows(wrapper).at(0).text()).toBe("10.0.0.3");
  })

  it('filters by equipment', async () => {
    const wrapper = mountFunction();
    wrapper.vm.search.equipments = ["SIMAR", "CountingPRU"];

    await wrapper.vm.$nextTick();

    const rows = wrapper.find(".container").find(".v-data-table").find(".v-data-table__wrapper").find("table").find("tbody").findAll("tr");
    expect(rows.at(0).findAll("td").at(0).text()).toBe("10.0.0.1");
    expect(rows.at(1).findAll("td").at(0).text()).toBe("10.0.0.3");
  })

  it('filters by room', async () => {
    const wrapper = mountFunction();
    wrapper.vm.search.room = "IA-01";

    await wrapper.vm.$nextTick();

    const rows = getRows(wrapper);
    expect(rows.at(0).text()).toBe("10.0.0.2");
  })
})
