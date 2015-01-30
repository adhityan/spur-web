spur          = require "spur-ioc"
localInjector = require "../../src/injector"

module.exports = ()->

  ioc = spur.create("test-spur-web")

  ioc.addDependency "config", {
    RootWebPath   : "/user/agustin/test/"
    useMockLogger : true
  }

  ioc.merge(localInjector())

  ioc
