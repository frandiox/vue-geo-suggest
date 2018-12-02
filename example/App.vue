<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <ComponentFixture>
      <VueGeosuggest />

      <Editor slot="control" slot-scope="scope" v-bind="scope" />
    </ComponentFixture>
  </div>
</template>

<script>
import { ComponentFixture, Editor } from "component-fixture";
import "component-fixture/dist/ComponentFixture.css";
import VueGeosuggest from "@/components/VueGeosuggest.vue";

export default {
  name: "App",
  components: {
    ComponentFixture,
    Editor,
    VueGeosuggest
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
